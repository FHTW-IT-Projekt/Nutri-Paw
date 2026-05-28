import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
export const sendReminderEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: `"NutriPaw System" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            text: text
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email gesendet an ${to}: ${info.response}`);
    } catch (error) {
        console.error('Fehler beim E-Mail-Versand:', error);
    }
};