import type React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Page() {
    return (
        <div className="bg-barely-lilac text-pompaca-purple-purple dark:bg-deep-purple dark:text-barely-lilac min-h-screen flex items-center justify-center px-4 py-5">
            <div className="w-full">
                {/* Privacy Policy*/}
                <Card className="bg-ebena-lavender dark:bg-midnight-purple w-full shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">
                            TFO.creaturetracker Privacy Policy{' '}
                        </CardTitle>
                        <CardDescription className="text-xl">
                            Last Updated: 8/15/2025
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-col py-5 text-md">
                        <div className="py-5">
                            <p>
                                This Privacy Policy explains how TFO.creaturetracker ("we," "us," or
                                "our") collects, uses, and discloses information about you when you
                                use our website and services (collectively, the "Service").
                            </p>
                            <p>
                                Your privacy is important to us. By using our Service, you agree to
                                the collection and use of information in accordance with this
                                policy.
                            </p>

                            <div className="py-5">
                                <h1 className="font-bold text-xl">1. Information We Collect</h1>
                                <p>We collect information in a few different ways:</p>
                                <ul>
                                    <li>
                                        <b>Information You Provide to Us:</b>
                                        <ul>
                                            <li>
                                                <b>Account Information:</b> When you register for an
                                                account, we collect information such as a username,
                                                email address, and a hashed password.
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        <b>
                                            Information We Access from a Third Party (The Final
                                            Outpost)
                                        </b>
                                        <ul>
                                            <li>
                                                <b>Source Site Data: </b> When you create an account
                                                and connect it to your profile on TFO (the "Source
                                                Site"), you authorize us to access and collect
                                                information from your Source Site account via their
                                                API. This information is limited to what the API
                                                makes available and may include your public profile
                                                data, username, user ID, and other related data. We
                                                only access this data to provide the core
                                                functionality of our Service.
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        <b>Information We Collect Automatically:</b>
                                        <ul>
                                            <li>
                                                <b>Log and Usage Data:</b> Like most websites, we
                                                automatically collect information that your browser
                                                sends whenever you visit our Service. This may
                                                include your IP address, browser type, browser
                                                version, the pages of our Service that you visit,
                                                the time and date of your visit, and other
                                                statistics.
                                            </li>
                                            <li>
                                                <b>Cookies:</b> We use cookies to operate and
                                                administer our site and to improve your experience.
                                                A cookie is a piece of information sent to your
                                                browser from a website and stored on your computer's
                                                hard drive. You can instruct your browser to refuse
                                                all cookies or to indicate when a cookie is being
                                                sent.
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                            <div className="py-5">
                                <h1 className="font-bold text-xl">
                                    2. How We Use Your Information
                                </h1>
                                <p>We use the information we collect for the following purposes:</p>
                                <ul>
                                    <li>
                                        <b>To Provide and Maintain the Service:</b> To create your
                                        account, display your data from the Source Site, and operate
                                        the features of our website.
                                    </li>
                                    <li>
                                        <b>To Improve the Service:</b> To understand how our users
                                        interact with the Service so we can make it better.
                                    </li>
                                    <li>
                                        <b>To Communicate With You:</b> To send you important
                                        notices about the Service or respond to your inquiries.
                                    </li>
                                    <li>
                                        <b>For Safety and Security:</b> To protect our Service and
                                        our users from fraud and abuse.
                                    </li>
                                </ul>
                            </div>
                            <div className="py-5">
                                <h1 className="font-bold text-xl">
                                    3. How We Share Your Information
                                </h1>
                                <p>
                                    We do not sell your personal information. We may share the
                                    information we collect in the following limited circumstances:
                                </p>
                                <ul>
                                    <li>
                                        <b>Publicly:</b> Certain information from your Source Site
                                        profile that we access may be displayed publicly on our
                                        Service as part of its core functionality (e.g., public
                                        leaderboards, user profiles).
                                    </li>
                                    <li>
                                        <b>For Legal Reasons:</b> We may disclose your information
                                        if we believe it's required by law, subpoena, or other legal
                                        process.
                                    </li>
                                    <li>
                                        <b>With Your Consent:</b> We may share your information with
                                        your consent or at your direction.
                                    </li>
                                </ul>
                            </div>
                            <div className="py-5">
                                <h1 className="font-bold text-xl">4. Data Security</h1>
                                <p>
                                    We take reasonable measures to help protect your information
                                    from loss, theft, misuse, and unauthorized access. However, no
                                    electronic transmission or storage is 100% secure. While we
                                    strive to use commercially acceptable means to protect your
                                    information, we cannot guarantee its absolute security.
                                </p>
                            </div>
                            <div className="py-5">
                                <h1 className="font-bold text-xl">5. Data Retention</h1>
                                <p>
                                    We retain your personal information for as long as your account
                                    is active or as needed to provide you with the Service. You may
                                    delete your account at any time, which will remove your personal
                                    information from our active databases.
                                </p>
                            </div>
                            <div className="py-5">
                                <h1 className="font-bold text-xl">6. Third-Party Services</h1>
                                <p>
                                    Our Service is fundamentally linked to the Source Site's API.
                                    This Privacy Policy does not apply to the practices of the
                                    Source Site. We encourage you to review{' '}
                                    <a href="https://finaloutpost.net/privacypolicy/">
                                        the privacy policy of The Final Outpost
                                    </a>{' '}
                                    to understand their data practices.
                                </p>
                            </div>
                            <div className="py-5">
                                <h1 className="font-bold text-xl">7. Children's Privacy</h1>
                                <p>
                                    Our Service is not intended for children under the age of 13. We
                                    do not knowingly collect personally identifiable information
                                    from children under 13. If you are a parent or guardian and you
                                    are aware that your child has provided us with personal
                                    information, please contact us.
                                </p>
                            </div>
                            <div className="py-5">
                                <h1 className="font-bold text-xl">8. Your Rights and Choices</h1>
                                <p>
                                    You have the right to access, update, or delete the information
                                    we have on you. You can do this by visiting your account
                                    settings page on our Service. You can also control cookie
                                    settings through your browser.
                                </p>
                            </div>
                            <div className="py-5">
                                <h1 className="font-bold text-xl">
                                    9. Changes to This Privacy Policy
                                </h1>
                                <p>
                                    We may update our Privacy Policy from time to time. We will
                                    notify you of any changes by posting the new Privacy Policy on
                                    this page. We encourage you to review this Privacy Policy
                                    periodically for any changes.
                                </p>
                            </div>
                            <div className="py-5">
                                <h1 className="font-bold text-xl">10. Contact Us</h1>
                                <p>
                                    If you have any questions about this Privacy Policy, please
                                    contact us at{' '}
                                    <a href="mailto:rio.savvii@gmail.com">rio.savvii@gmail.com</a>.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
