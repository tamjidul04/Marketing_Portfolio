'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { cleanNote, isStatus, isUuid } from '@/lib/inbox';

/*
 * Inbox actions. Each one re-checks the caller is an admin, validates every input,
 * and the database checks again (RLS + admins may only change status and the private note).
 */

export type InboxResult = { ok?: true; error?: string };
const GENERIC = 'Sorry, that did not work. Please try again.';
const GONE = 'This message no longer exists (it may have been deleted).';

function refresh(id: string) {
  revalidatePath('/inbox');
  revalidatePath(`/inbox/${id}`);
  revalidatePath('/');
}

export async function setMessageStatus(id: string, status: string): Promise<InboxResult> {
  await requireAdmin();
  if (!isUuid(id) || !isStatus(status)) return { error: GENERIC };
  const db = await createClient();
  const { data, error } = await db.from('contact_messages').update({ status }).eq('id', id).select('id');
  if (error) {
    console.error('setMessageStatus failed:', error.message);
    return { error: GENERIC };
  }
  if (!data?.length) return { error: GONE };
  refresh(id);
  return { ok: true };
}

/** Opening a new message marks it read. Only touches "new" messages, so it never undoes "replied" etc. */
export async function markMessageRead(id: string): Promise<InboxResult> {
  await requireAdmin();
  if (!isUuid(id)) return { error: GENERIC };
  const db = await createClient();
  const { error } = await db.from('contact_messages').update({ status: 'read' }).eq('id', id).eq('status', 'new');
  if (error) return { error: GENERIC };
  refresh(id);
  return { ok: true };
}

export async function saveMessageNote(id: string, note: string): Promise<InboxResult> {
  await requireAdmin();
  if (!isUuid(id)) return { error: GENERIC };
  const clean = cleanNote(note);
  if (!clean.ok) return { error: clean.error };
  const db = await createClient();
  const { data, error } = await db.from('contact_messages').update({ admin_note: clean.note }).eq('id', id).select('id');
  if (error) {
    console.error('saveMessageNote failed:', error.message);
    return { error: GENERIC };
  }
  if (!data?.length) return { error: GONE };
  refresh(id);
  return { ok: true };
}

export async function deleteMessage(id: string): Promise<InboxResult> {
  await requireAdmin();
  if (!isUuid(id)) return { error: GENERIC };
  const db = await createClient();
  const { error } = await db.from('contact_messages').delete().eq('id', id);
  if (error) {
    console.error('deleteMessage failed:', error.message);
    return { error: GENERIC };
  }
  refresh(id);
  redirect('/inbox?notice=deleted');
}
