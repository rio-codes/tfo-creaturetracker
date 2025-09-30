import type React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Page() {
    return (
        <div className="bg-barely-lilac text-pompaca-purple dark:bg-deep-purple dark:text-barely-lilac min-h-screen flex items-center justify-center px-4 py-5">
            <div className="w-full">
                {/* Terms of Service */}
                <Card className="bg-ebena-lavender dark:bg-midnight-purple w-full shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">
                            TFO.creaturetracker Terms of Service{' '}
                        </CardTitle>
                        <CardDescription className="text-xl">
                            Last Updated: 8/15/2025
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-col py-5 text-md">
                        <div className="py-5">
                            <p>
                                <b>
                                    Welcome to TFO.creaturetracker! Before you use our website and
                                    services (collectively, the &#34;Service&#34;), please read
                                    these Terms of Service (&#34;Terms&#34;) carefully.
                                </b>
                            </p>
                            <p>
                                This is a binding agreement. By accessing or using our Service, you
                                agree to be bound by these Terms. If you do not agree to all of
                                these Terms, do not use the Service.
                            </p>
                        </div>

                        <div className="py-5">
                            <h1 className="font-bold text-xl">1. Description of Service</h1>
                            <p>
                                TFO.creaturetracker is an unofficial, non-commercial fan-made
                                website. Our Service uses a publicly available Application
                                Programming Interface (API) to fetch and display data, including
                                text and images, from The Final Outpost (the &#34;Source Site&#34;)
                                to help track and manage breeding adoptable creatures from this
                                site.
                            </p>
                        </div>

                        <div className="py-5">
                            <h1 className="font-bold text-xl">
                                2. Intellectual Property and Content
                            </h1>
                            <p>
                                This is a fan site. We do not claim ownership of any of the
                                intellectual property belonging to the Source Site.
                            </p>
                            <ul>
                                <li>
                                    <b>Third-Party Content: </b>All trademarks, service marks, trade
                                    names, characters, data, and images displayed on our Service via
                                    the API are the property of the Source Site and/or their
                                    respective owners. Their use on this Service is for
                                    identification, information, and fan engagement purposes only.
                                </li>
                                <li>
                                    <b>Source Code: </b>The source code for this website is licensed
                                    under the GNU Affero General Public License (AGPL). You are free
                                    to use, modify, and distribute it in accordance with the terms
                                    of that license.
                                </li>
                            </ul>
                        </div>

                        <div className="py-5">
                            <h1 className="font-bold text-xl">
                                3. User Accounts and Data from the Source Site
                            </h1>
                            <p>
                                To use our features, you will need to create an account on our
                                Service.
                            </p>
                            <ul>
                                <li>
                                    <b>Account Creation: </b>You agree to provide accurate and
                                    complete information when creating your account and to keep this
                                    information up to date. You are responsible for safeguarding
                                    your password and for all activities that occur under your
                                    account.
                                </li>
                                <li>
                                    <b>Authorization to Access Your Data: </b>By creating an account
                                    and linking it to your TFO profile,{' '}
                                    <b>
                                        you explicitly grant TFO.creaturetracker permission to
                                        access and retrieve data associated with your account on the
                                        Source Site via their API.
                                    </b>{' '}
                                    This includes data on all creatures in your collection, tabs,
                                    and other related made available by the API. We will use this
                                    data solely to provide and improve the features of our Service.
                                </li>
                            </ul>
                        </div>

                        <div className="py-5">
                            <h1 className="font-bold text-xl">4. User Conduct</h1>
                            <p>You agree not to use the Service to:</p>
                            <ul>
                                <li>Violate any local, state, national, or international law.</li>
                                <li>Harass, abuse, or harm another person.</li>
                                <li>
                                    Attempt to gain unauthorized access to our computer systems or
                                    engage in any activity that disrupts, diminishes the quality of,
                                    or interferes with the performance of the Service.
                                </li>
                                <li>
                                    Scrape, crawl, or use any other automated means to access the
                                    Service for any purpose without our express written permission.
                                </li>
                            </ul>
                        </div>
                        <div className="py-5">
                            <h1 className="font-bold text-xl">5. Third-Party API</h1>
                            <p>
                                Our Service is entirely dependent on the API provided by the Source
                                Site. You acknowledge and agree that:
                            </p>
                            <ul>
                                <li>
                                    We are not responsible for the accuracy, content, or
                                    availability of the data provided by the Source Site&#39;s API.
                                </li>
                                <li>
                                    The Source Site may change or discontinue its API at any time,
                                    which may cause our Service to become partially or completely
                                    unavailable. We are not liable for any such disruption.
                                </li>
                            </ul>
                        </div>
                        <div className="py-5">
                            <h1 className="font-bold text-xl">6. Termination</h1>
                            <p>
                                We reserve the right to suspend or terminate your access to the
                                Service at any time, without notice or liability, for any reason,
                                including if you breach these Terms.
                            </p>
                        </div>
                        <div className="py-5">
                            <h1 className="font-bold text-xl">
                                7. Disclaimers and Limitation of Liability
                            </h1>
                            <p>
                                THE SERVICE IS PROVIDED ON AN &#34;AS IS&#34; AND &#34;AS
                                AVAILABLE&#34; BASIS. WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED,
                                THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. TO
                                THE FULLEST EXTENT PERMITTED BY LAW, TFO.CREATURETRACKER AND ITS
                                OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
                                REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, ARISING FROM YOUR
                                USE OF THE SERVICE.
                            </p>
                        </div>
                        <div className="py-5">
                            <h1 className="font-bold text-xl">8. Governing Law</h1>
                            <p>
                                These Terms shall be governed by the laws of California, United
                                States, without regard to its conflict of law provisions.
                            </p>
                        </div>
                        <div className="py-5">
                            <h1 className="font-bold text-xl">9. Changes to These Terms</h1>
                            <p>
                                We may modify these Terms from time to time. We will notify you of
                                any changes by posting the new Terms on this page. Your continued
                                use of the Service after any such change constitutes your acceptance
                                of the new Terms.
                            </p>
                        </div>
                        <div className="py-5">
                            <h1 className="font-bold text-xl">10. Contact Us</h1>
                            <p>
                                If you have any questions about these Terms, please contact us at{' '}
                                <a href="mailto:tfoct@mailbox.org">tfoct@mailbox.org</a>.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
