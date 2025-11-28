const Student = require('../models/Student');

// Import the createTransporter function from welcomeEmailService
const { createTransporter } = require('../services/welcomeEmailService');

// Professional email template
const feedbackEmailTemplate = (studentName, feedbackLink) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            background-color: #f5f5f5;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #0056b3;
        }
        .header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 30px 20px;
            color: #444;
        }
        .content p {
            margin: 15px 0;
            font-size: 15px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: all 0.3s ease;
            margin: 20px 0;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        .signature {
            margin-top: 30px;
            border-top: 1px solid #eee;
            padding-top: 20px;
            text-align: center;
        }
        .signature p {
            color: #666;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0 10px;
            }
            .header {
                padding: 20px;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Feedback Request</h2>
        </div>
        <div class="content">
            <p>Dear ${studentName},</p>
            <p>We hope this email finds you well. As part of our continuous improvement process, we would like to gather your valuable feedback about your experience with our ScholarSync portal.</p>
            <p>We value your thoughts and would love to hear about your experience. Your feedback will help us enhance our portal and make it even better for future students.</p>
            <p><a href="${feedbackLink}" class="button">Provide Feedback</a></p>
            <p>Your input is highly valuable to us. It will help us:</p>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li>Improve our features</li>
                <li>Enhance user experience</li>
                <li>Address any issues you may have encountered</li>
            </ul>
            <p>Thank you for taking the time to share your thoughts. Your feedback is greatly appreciated!</p>
            <div class="signature">
                <p>Best regards,<br>The ScholarSync Team</p>
                <p style="font-size: 13px; color: #888;">ScholarSync</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

exports.sendFeedbackEmails = async (req, res) => {
    try {
        const { feedbackLink, studentIds } = req.body;

        // Validate inputs
        if (!feedbackLink || !studentIds || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Feedback link and student IDs are required'
            });
        }

        // Get students
        const students = await Student.find({ _id: { $in: studentIds } });

        // Create transporter using OAuth2
        const transporter = await createTransporter();

        // Send emails
        const promises = students.map(async (student) => {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: student.email,
                subject: 'Feedback Request - ScholarSync',
                html: feedbackEmailTemplate(student.name, feedbackLink)
            };

            return transporter.sendMail(mailOptions);
        });

        await Promise.all(promises);

        res.status(200).json({
            success: true,
            message: 'Feedback emails sent successfully'
        });

    } catch (error) {
        console.error('Error sending feedback emails:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send feedback emails'
        });
    }
};