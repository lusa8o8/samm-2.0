import { SiX, SiInstagram, SiFacebook, SiWhatsapp, SiYoutube } from 'react-icons/si';
import { Mail, Linkedin, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Channel } from '../../types';

interface ChannelIconProps {
  channel: Channel;
  size?: number;
  className?: string;
}

const channelColors: Record<Channel, string> = {
  linkedin: 'text-[#0077B5]',
  twitter: 'text-[#1DA1F2]',
  instagram: 'text-[#E1306C]',
  email: 'text-slate-500',
  facebook: 'text-[#1877F2]',
  whatsapp: 'text-[#25D366]',
  youtube: 'text-[#FF0000]',
  design_brief: 'text-amber-600',
};

export function ChannelIcon({ channel, size = 14, className }: ChannelIconProps) {
  const colorClass = channelColors[channel];

  switch (channel) {
    case 'linkedin': return <Linkedin size={size} className={cn(colorClass, className)} />;
    case 'twitter': return <SiX size={size} className={cn(colorClass, className)} />;
    case 'instagram': return <SiInstagram size={size} className={cn(colorClass, className)} />;
    case 'facebook': return <SiFacebook size={size} className={cn(colorClass, className)} />;
    case 'whatsapp': return <SiWhatsapp size={size} className={cn(colorClass, className)} />;
    case 'youtube': return <SiYoutube size={size} className={cn(colorClass, className)} />;
    case 'design_brief': return <FileText size={size} className={cn(colorClass, className)} />;
    case 'email': return <Mail size={size} className={cn('text-slate-500', className)} />;
    default: return null;
  }
}
