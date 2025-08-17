import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `http://tfo.creaturetracker.net/reset-password?token=${token}`;

    const { data, error } = await resend.emails.send({
        from: 'noreply@tfo.creaturetracker.net',
        to: email,
        subject: 'Reset Your Password',
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
    });

    if (error) {
        return console.error({ error });
    }

    console.log({ data });
};