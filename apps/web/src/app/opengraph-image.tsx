import { ImageResponse } from "next/og";
import { getProfile, getSettings } from "@/lib/content";

// Default share image (WhatsApp / Facebook / LinkedIn / X previews). Used whenever no custom
// share image is uploaded in settings. Branded from the database: name, headline and colours.
export const alt = "Portfolio preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const navy = settings.color_primary;
  const gold = settings.color_accent;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: navy, color: "#ffffff", padding: 72, position: "relative" }}>
        <div style={{ position: "absolute", right: -120, top: -120, width: 520, height: 520, borderRadius: 9999, background: gold, opacity: 0.22 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: gold, color: navy, fontSize: 34, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {profile.initials}
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{profile.full_name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, display: "flex", flexWrap: "wrap" }}>{profile.headline}</div>
          <div style={{ fontSize: 34, color: gold, fontWeight: 700 }}>{profile.role_title}</div>
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
