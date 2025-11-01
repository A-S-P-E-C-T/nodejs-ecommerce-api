import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    // setup mailgen
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "E-Commerce Website",
            link: "https://e-commerce.com",
        },
    });

    // generate html + text
    const emailTextual = mailGenerator.generatePlaintext(
        options.mailgenContent
    );
    const emailHtml = mailGenerator.generate(options.mailgenContent);

    // mailtrap config
    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        },
    });

    // mail details
    const mail = {
        from: '"E-Commerce Website" <noreply@e-commerce.com>',
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml,
    };

    // send mail
    try {
        await transporter.sendMail(mail);
        console.log("✅ Email sent to:", options.email);
    } catch (error) {
        console.error(
            "❌ Email sending failed. Check your MAILTRAP credentials in .env"
        );
        console.error("Error:", error);
    }
};

// MAILGEN CONTENT HELPERS

// 1. email verification template
const emailVerificationMailgenContent = (username, verificationUrl) => ({
    body: {
        name: username,
        intro: "Welcome to our App! 🎉",
        action: {
            instructions:
                "To verify your email, please click the button below:",
            button: {
                color: "#1aae5a",
                text: "Verify your email",
                link: verificationUrl,
            },
        },
        outro: "Need help or have questions? Just reply to this email — we’d love to help.",
    },
});

// 2. forgot password template
const forgotPasswordMailgenContent = (username, resetPasswordUrl) => ({
    body: {
        name: username,
        intro: "We received a request to reset your password.",
        action: {
            instructions: "Click the button below to reset your password:",
            button: {
                color: "#366e6d",
                text: "Reset password",
                link: resetPasswordUrl,
            },
        },
        outro: "Didn’t request a password reset? You can ignore this email.",
    },
});

const deleteUserMailgenContent = (username, deleteAccountUrl) => ({
    body: {
        name: username,
        intro: "You requested to delete your account.",
        action: {
            instructions:
                "Click the button below to permanently delete your account:",
            button: {
                color: "#e63946",
                text: "Delete my account",
                link: deleteAccountUrl,
            },
        },
        outro: "If you didn’t request this, please ignore this email. Your account will remain active.",
    },
});

export {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    deleteUserMailgenContent,
};
