import { Mail, Linkedin } from "lucide-react";
import { SiFacebook, SiInstagram, SiWhatsapp, SiX, SiYoutube } from "react-icons/si";
import { cn } from "@/lib/utils";
import type { WorkspaceChannel } from "@/components/workspace/calendar-studio/types";

interface ChannelIconProps {
  channel: WorkspaceChannel;
  size?: number;
  className?: string;
}

const channelColors: Record<WorkspaceChannel, string> = {
  linkedin: "text-[#0077B5]",
  twitter: "text-[#1DA1F2]",
  instagram: "text-[#E1306C]",
  email: "text-slate-500",
  facebook: "text-[#1877F2]",
  whatsapp: "text-[#25D366]",
  youtube: "text-[#FF0000]",
};

export function ChannelIcon({ channel, size = 14, className }: ChannelIconProps) {
  const colorClass = channelColors[channel];

  switch (channel) {
    case "linkedin":
      return <Linkedin size={size} className={cn(colorClass, className)} />;
    case "twitter":
      return <SiX size={size} className={cn(colorClass, className)} />;
    case "instagram":
      return <SiInstagram size={size} className={cn(colorClass, className)} />;
    case "facebook":
      return <SiFacebook size={size} className={cn(colorClass, className)} />;
    case "whatsapp":
      return <SiWhatsapp size={size} className={cn(colorClass, className)} />;
    case "youtube":
      return <SiYoutube size={size} className={cn(colorClass, className)} />;
    case "email":
      return <Mail size={size} className={cn("text-slate-500", className)} />;
    default:
      return null;
  }
}
