import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];
export type Profile = Tables["profile"]["Row"];
export type SiteSettings = Tables["site_settings"]["Row"];
export type Stat = Tables["stats"]["Row"];
export type Brand = Tables["brands"]["Row"];
export type Certification = Tables["certifications"]["Row"];
export type Service = Tables["services"]["Row"];
export type ProcessStep = Tables["process_steps"]["Row"];
export type Tool = Tables["tools"]["Row"];
export type AboutFact = Tables["about_facts"]["Row"];
export type Faq = Tables["faqs"]["Row"];
export type CaseStudy = Tables["case_studies"]["Row"];
export type CaseStudyImage = Tables["case_study_images"]["Row"];
export type Testimonial = Tables["testimonials"]["Row"];

/*
 * Every fetcher is cached and tagged "content". The admin panel (or a webhook) can call
 * revalidateTag("content") for instant updates; otherwise content refreshes within minutes,
 * so edits made anywhere (admin panel, Supabase Table Editor) always reach the site.
 * Errors are thrown on purpose: a failed fetch must never be cached as "empty".
 */
function ok<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Could not load ${what}: ${res.error.message}`);
  return res.data as T;
}

export async function getProfile(): Promise<Profile> {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  return ok(await createPublicClient().from("profile").select("*").eq("id", 1).single(), "profile");
}

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  return ok(await createPublicClient().from("site_settings").select("*").eq("id", 1).single(), "settings");
}

const db = () => createPublicClient();

export async function getStats(): Promise<Stat[]> {
  "use cache"; cacheTag("content"); cacheLife("minutes");
  return ok(await db().from("stats").select("*").eq("is_visible", true).order("sort_order"), "stats");
}
export async function getBrands(): Promise<Brand[]> {
  "use cache"; cacheTag("content"); cacheLife("minutes");
  return ok(await db().from("brands").select("*").eq("is_visible", true).order("sort_order"), "brands");
}
export async function getCertifications(): Promise<Certification[]> {
  "use cache"; cacheTag("content"); cacheLife("minutes");
  return ok(await db().from("certifications").select("*").eq("is_visible", true).order("sort_order"), "certifications");
}
export async function getServices(): Promise<Service[]> {
  "use cache"; cacheTag("content"); cacheLife("minutes");
  return ok(await db().from("services").select("*").eq("is_visible", true).order("sort_order"), "services");
}
export async function getProcessSteps(): Promise<ProcessStep[]> {
  "use cache"; cacheTag("content"); cacheLife("minutes");
  return ok(await db().from("process_steps").select("*").eq("is_visible", true).order("sort_order"), "process steps");
}
export async function getTools(): Promise<Tool[]> {
  "use cache"; cacheTag("content"); cacheLife("minutes");
  return ok(await db().from("tools").select("*").eq("is_visible", true).order("sort_order"), "tools");
}
export async function getAboutFacts(): Promise<AboutFact[]> {
  "use cache"; cacheTag("content"); cacheLife("minutes");
  return ok(await db().from("about_facts").select("*").eq("is_visible", true).order("sort_order"), "about facts");
}
export async function getFaqs(): Promise<Faq[]> {
  "use cache"; cacheTag("content"); cacheLife("minutes");
  return ok(await db().from("faqs").select("*").eq("is_visible", true).order("sort_order"), "faqs");
}
export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache"; cacheTag("content"); cacheLife("minutes");
  return ok(await db().from("testimonials").select("*").eq("is_visible", true).order("sort_order"), "testimonials");
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  const res = await createPublicClient().from("case_studies").select("*").eq("status", "published").order("sort_order", { ascending: true });
  return ok(res, "case studies");
}

export async function getCaseStudy(slug: string): Promise<{ study: CaseStudy; images: CaseStudyImage[] } | null> {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  const db = createPublicClient();
  const { data: study, error } = await db.from("case_studies").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw new Error(`Could not load case study: ${error.message}`);
  if (!study) return null;
  const images = ok(await db.from("case_study_images").select("*").eq("case_study_id", study.id).order("sort_order"), "case study images");
  return { study, images };
}

/** Current year for the footer. Cached so `new Date()` is allowed during prerender. */
export async function getYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
