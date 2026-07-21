'use client';

import React from 'react';
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

interface SocialLinksProps {
    links: string[];
}

function getSocialIcon(hostname: string): React.ElementType {
    const host = hostname.toLowerCase().replace(/^www\./, '');
    if (host.includes('discord')) return FaDiscord;
    if (host.includes('github')) return FaGithub;
    if (host.includes('patreon')) return FaPatreon;
    if (host.includes('twitter') || host === 'x.com' || host.endsWith('.x.com')) return FaTwitter;
    if (host.includes('instagram')) return FaInstagram;
    if (host.includes('tiktok')) return FaTiktok;
    if (host.includes('twitch')) return FaTwitch;
    if (host.includes('linkedin')) return FaLinkedin;
    if (host.includes('facebook') || host === 'fb.com') return FaFacebook;
    if (host.includes('reddit')) return FaReddit;
    if (host.includes('youtube') || host === 'youtu.be') return FaYoutube;
    return LinkIcon;
}

export function SocialLinks({ links }: SocialLinksProps) {
    if (!links || links.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-4">
            {links.map((link, index) => {
                let formattedLink = link.trim();
                if (!formattedLink) return null;

                if (!/^https?:\/\//i.test(formattedLink)) {
                    formattedLink = `https://${formattedLink}`;
                }

                try {
                    const url = new URL(formattedLink);
                    const Icon = getSocialIcon(url.hostname);

                    return (
                        <TooltipProvider key={index}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href={formattedLink} target="_blank" rel="noopener noreferrer">
                                        <Icon className="h-6 w-6 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson hover:opacity-80 transition-opacity" />
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>{formattedLink}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                } catch (e) {
                    console.error(`Error parsing social link:`, e, `for link:`, link);
                    return null;
                }
            })}
        </div>
    );
}
