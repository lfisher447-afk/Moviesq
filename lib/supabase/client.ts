/**
 * Supabase compatibility shim — backed by Firebase Auth + Firestore.
 *
 * This project has leftover Supabase API calls that were never migrated to
 * Firebase. Rather than rewriting every component, this shim implements the
 * exact subset of the Supabase client interface that is used, routing all
 * calls through Firebase Auth and Firestore.
 *
 * Covered API surface:
 *   auth.getSession / getUser / signInWithPassword / signOut / onAuthStateChange
 *   .from(table).select(fields).eq(f,v)...single()
 *   .from(table).insert(payload)
 *   .from(table).upsert(payload, { onConflict })
 *   .from(table).update(payload).eq(f,v).eq(f2,v2)
 *   .from(table).delete().eq(f,v)...
 *   .from(table).select("*").eq(f,v).order(field, { ascending })
 */

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  setDoc,
  doc,
  serverTimestamp,
  type QueryConstraint,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

// ── Helpers ────────────────────────────────────────────────────────────────

function mapFirebaseUser(fbUser: FirebaseUser | null) {
  if (!fbUser) return null
  return {
    id: fbUser.uid,
    email: fbUser.email,
    user_metadata: { full_name: fbUser.displayName },
  }
}

// ── Auth shim ──────────────────────────────────────────────────────────────

const authShim = {
  async getSession() {
    const user = auth.currentUser
    return {
      data: { session: user ? { user: mapFirebaseUser(user) } : null },
      error: null,
    }
  },

  async getUser() {
    return { data: { user: mapFirebaseUser(auth.currentUser) }, error: null }
  },

  async signInWithPassword({
    email,
    password,
  }: {
    email: string
    password: string
  }) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      return { data: { user: mapFirebaseUser(cred.user) }, error: null }
    } catch (err: any) {
      return { data: { user: null }, error: { message: err.message } }
    }
  },

  async signOut() {
    try {
      await firebaseSignOut(auth)
      return { error: null }
    } catch (err: any) {
      return { error: { message: err.message } }
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      const session = fbUser ? { user: mapFirebaseUser(fbUser) } : null
      callback(fbUser ? "SIGNED_IN" : "SIGNED_OUT", session)
    })
    return { data: { subscription: { unsubscribe: unsub } } }
  },
}

// ── Firestore query builder shim ───────────────────────────────────────────

type AnyRecord = Record<string, any>
type OrderOpts = { ascending?: boolean }

function buildFromChain(tableName: string) {
  const filters: Array<{ field: string; value: any }> = []
  let _orderField: string | null = null
  let _orderAscending = true
  let _pendingUpdate: AnyRecord | null = null

  async function runQuery() {
    const constraints: QueryConstraint[] = filters.map((f) =>
      where(f.field, "==", f.value)
    )
    if (_orderField) {
      constraints.push(orderBy(_orderField, _orderAscending ? "asc" : "desc"))
    }
    return getDocs(query(collection(db, tableName), ...constraints))
  }

  const chain = {
    select(_fields: string) {
      return chain
    },

    eq(field: string, value: any) {
      filters.push({ field, value })
      return chain
    },

    order(field: string, opts: OrderOpts = {}) {
      _orderField = field
      _orderAscending = opts.ascending !== false
      return chain
    },

    async single(): Promise<{ data: AnyRecord | null; error: any }> {
      try {
        const snap = await runQuery()
        if (snap.empty) {
          return { data: null, error: { code: "PGRST116", message: "No rows returned" } }
        }
        const d = snap.docs[0]
        return { data: { id: d.id, ...d.data() }, error: null }
      } catch (err: any) {
        return { data: null, error: { message: err.message } }
      }
    },

    then(
      resolve: (v: { data: AnyRecord[]; error: any }) => any,
      reject?: (e: any) => any
    ) {
      return runQuery()
        .then((snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          return resolve({ data, error: null })
        })
        .catch((err) => {
          const result = { data: [], error: { message: err.message } }
          return reject ? reject(result) : resolve(result)
        })
    },

    async insert(payload: AnyRecord): Promise<{ error: any }> {
      try {
        await addDoc(collection(db, tableName), {
          ...payload,
          user_id: payload.user_id ?? auth.currentUser?.uid,
          created_at: serverTimestamp(),
        })
        return { error: null }
      } catch (err: any) {
        return { error: { message: err.message } }
      }
    },

    async upsert(
      payload: AnyRecord | AnyRecord[],
      opts?: { onConflict?: string; ignoreDuplicates?: boolean }
    ): Promise<{ error: any }> {
      try {
        const uid = auth.currentUser?.uid
        const items = Array.isArray(payload) ? payload : [payload]

        await Promise.all(
          items.map(async (item) => {
            let docId: string | undefined

            if (opts?.onConflict) {
              docId = opts.onConflict
                .split(",")
                .map((f) => {
                  const key = f.trim()
                  return key === "user_id" ? uid : item[key]
                })
                .filter(Boolean)
                .join("_")
            }

            const ref = docId
              ? doc(db, tableName, docId)
              : doc(collection(db, tableName))

            await setDoc(
              ref,
              { ...item, user_id: item.user_id ?? uid, updated_at: serverTimestamp() },
              { merge: true }
            )
          })
        )

        return { error: null }
      } catch (err: any) {
        return { error: { message: err.message } }
      }
    },

    // Fixed: Returning a chain object for delete instead of a raw Promise
    delete() {
      const deleteChain = {
        eq(field: string, value: any) {
          filters.push({ field, value })
          return deleteChain
        },
        then(
          resolve: (v: { error: any }) => any,
          reject?: (e: any) => any
        ) {
          return runQuery()
            .then(async (snap) => {
              await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
              return resolve({ error: null })
            })
            .catch((err) => {
              const result = { error: { message: err.message } }
              return reject ? reject(result) : resolve(result)
            })
        },
      }

      return deleteChain
    },

    update(payload: AnyRecord) {
      _pendingUpdate = payload

      const updateChain = {
        eq(field: string, value: any) {
          filters.push({ field, value })
          return updateChain
        },
        then(
          resolve: (v: { error: any }) => any,
          reject?: (e: any) => any
        ) {
          return runQuery()
            .then(async (snap) => {
              await Promise.all(
                snap.docs.map((d) =>
                  setDoc(
                    d.ref,
                    { ..._pendingUpdate, updated_at: serverTimestamp() },
                    { merge: true }
                  )
                )
              )
              return resolve({ error: null })
            })
            .catch((err) => {
              const result = { error: { message: err.message } }
              return reject ? reject(result) : resolve(result)
            })
        },
      }

      return updateChain
    },
  }

  return chain
}

// ── Public createClient ────────────────────────────────────────────────────

export function createClient() {
  return {
    auth: authShim,
    from(tableName: string) {
      return buildFromChain(tableName)
    },
  }
}
