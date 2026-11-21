import { ImageResponse } from "next/og";
import { getProfile, getSettings } from "@/lib/content";

// Automatic share image (WhatsApp / Facebook / LinkedIn / X previews), branded from the database.
// It is a normal route (/og), NOT the opengraph-image file convention: that convention would always
// override an uploaded share image or a case-study cover. The metadata points here only as a fallback.
const size = { width: 1200, height: 630 };

export async function GET() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const navy = settings.color_primary;
  const accent = settings.color_accent;
  const highlight = settings.color_highlight;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: navy, color: "#ffffff", padding: 72, position: "relative" }}>
        <div style={{ position: "absolute", right: -120, top: -120, width: 520, height: 520, borderRadius: 9999, background: accent, opacity: 0.3 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: highlight, color: navy, fontSize: 34, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {profile.initials}
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{profile.full_name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, display: "flex", flexWrap: "wrap" }}>{profile.headline}</div>
          <div style={{ fontSize: 34, color: highlight, fontWeight: 700 }}>{profile.role_title}</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {profile.hero_tags.slice(0, 4).map((t) => (
            <div key={t} style={{ fontSize: 24, fontWeight: 700, padding: "8px 20px", borderRadius: 9999, background: "rgba(255,255,255,0.14)" }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
