import { MessageCircle } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppFloating({ settings }: { settings: SiteSettings }) {
  return (
    <a
      href={buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_default_message)}
      target="_blank"
      rel="noreferrer"
      className="floating-whatsapp btn btn-mint shadow-[0_16px_36px_rgba(31,135,112,0.32)]"
      aria-label={settings.whatsapp_button_label}
    >
      <MessageCircle size={20} />
      <span className="hidden sm:inline">{settings.whatsapp_button_label}</span>
    </a>
  );
}
