import { ImageResponse } from "next/og";
import { getProfile, getSettings } from "@/lib/content";

// Browser-tab icon generated from the owner's initials and brand colours.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: settings.color_primary, color: settings.color_accent, fontSize: 30, fontWeight: 800, borderRadius: 14 }}>
        {profile.initials.slice(0, 2)}
      </div>
    ),
    { ...size },
  );
}
