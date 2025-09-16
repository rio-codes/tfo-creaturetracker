'use client';

import {
    FaDiscord,
    FaGithub,
    FaPatreon,
    FaTwitter,
    FaInstagram,
    FaTiktok,
    FaTwitch,
    FaLinkedin,
    FaFacebook,
    FaReddit,
    FaYoutube,
} from 'react-icons/fa';
import { Link as LinkIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as Sentry from '@sentry/nextjs';

interface SocialLinksProps {
    links: string[];
}

const iconMap: { [key: string]: React.ElementType } = {
    'discord.com': FaDiscord,
    'discord.gg': FaDiscord,
    'github.com': FaGithub,
    'patreon.com': FaPatreon,
    'twitter.com': FaTwitter,
    'x.com': FaTwitter,
    'instagram.com': FaInstagram,
    'tiktok.com': FaTiktok,
    'twitch.tv': FaTwitch,
    'linkedin.com': FaLinkedin,
    'facebook.com': FaFacebook,
    'reddit.com': FaReddit,
    'youtube.com': FaYoutube,
    'youtu.be': FaYoutube,
};

export function SocialLinks({ links }: SocialLinksProps) {
    if (!links || links.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-4">
            {links.map((link, index) => {
                try {
                    const url = new URL(link);
                    const domain = url.hostname.replace('www.', '');
                    const Icon = iconMap[domain] || LinkIcon;

                    return (
                        <TooltipProvider key={index}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href={link} target="_blank" rel="noopener noreferrer">
                                        <Icon className="h-6 w-6 text-pompaca-purple dark:text-purple-300 hover:opacity-80 transition-opacity" />
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>{link}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                } catch (e) {
                    console.error(`Error parsing social link:`, e, `for link:`, link);
                    Sentry.captureException(e, { extra: { link: link } });
                    return null; // Ignore invalid URLs
                }
            })}
        </div>
    );
}
