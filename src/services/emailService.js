// Resend Email Integration Service for Jobberman x Mastercard Foundation Mentorship Portal
export const emailService = {
  /**
   * Generic send email method via Backend Serverless Relay & Resend API
   */
  async sendEmail({ to, subject, html, replyTo = "support@jobberman.com" }) {
    if (!to || !to.includes('@')) {
      console.warn('[EmailService] Invalid recipient email address:', to);
      return { success: false, error: 'Invalid recipient' };
    }

    try {
      const response = await fetch("/v1/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: [to],
          replyTo: replyTo,
          subject: subject,
          html: html
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.warn("[Resend Email Error]", data);
        return { success: false, error: data };
      }

      console.log(`[Resend Email Sent] Successfully sent "${subject}" to ${to} (ID: ${data.id})`);
      return { success: true, id: data.id };
    } catch (err) {
      console.warn("[Resend Dispatch Exception]", err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * 1. Triggered when an Associate books a session -> Sent to Mentor
   */
  async sendSessionBookedToMentor({ mentorEmail, mentorName, associateName, associateTitle, associateOrg, date, time, objective }) {
    const subject = `📅 New Mentorship Session Booked: ${associateName} (${date} at ${time})`;
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #1b0a3a 0%, #2e1065 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #ffd700; margin-bottom: 8px;">Mastercard Foundation Associates Program</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">New 1-on-1 Mentorship Request</h1>
        </div>

        <div style="padding: 28px; color: #1e293b; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${mentorName}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">
            <strong>${associateName}</strong> has booked an open 1-on-1 mentorship time slot on your calendar.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">Session Details</div>
            <div style="margin-bottom: 8px; font-size: 14px;"><strong>Associate:</strong> ${associateName} (${associateTitle})</div>
            <div style="margin-bottom: 8px; font-size: 14px;"><strong>Host Organization:</strong> ${associateOrg || 'Jobberman Partner Network'}</div>
            <div style="margin-bottom: 8px; font-size: 14px;"><strong>Date & Time:</strong> ${date} at ${time} (1 Hour)</div>
            <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #cbd5e1;">
              <div style="font-weight: 700; font-size: 13px; color: #2563eb; margin-bottom: 4px;">Mentorship Agenda & Discussion Points:</div>
              <p style="font-size: 14px; color: #334155; margin: 0; font-style: italic; white-space: pre-wrap;">"${objective}"</p>
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0 16px;">
            <a href="https://mentorship-jobberman.vercel.app/mentor" style="background: #2563eb; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 700; border-radius: 50px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
              Accept Session & Generate Google Meet Link
            </a>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 18px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Jobberman Nigeria · Mastercard Foundation Mentorship Initiative<br/>
          Questions? Contact <a href="mailto:support@jobberman.com" style="color: #2563eb; text-decoration: none;">support@jobberman.com</a>
        </div>
      </div>
    `;
    return this.sendEmail({ to: mentorEmail, subject, html });
  },

  /**
   * 2. Triggered when a Mentor accepts a session -> Sent to Associate with Google Meet Link
   */
  async sendSessionAcceptedToAssociate({ associateEmail, associateName, mentorName, date, time, meetingLink }) {
    const subject = `🎉 Session Accepted! 1-on-1 with ${mentorName} (${date} at ${time})`;
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #a7f3d0; margin-bottom: 8px;">Mastercard Foundation Associates Program</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">Mentorship Session Confirmed!</h1>
        </div>

        <div style="padding: 28px; color: #1e293b; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${associateName}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">
            Great news! <strong>${mentorName}</strong> has accepted your 1-on-1 mentorship session request.
          </p>

          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #047857; margin-bottom: 12px;">Confirmed Schedule</div>
            <div style="margin-bottom: 8px; font-size: 14px;"><strong>Executive Mentor:</strong> ${mentorName}</div>
            <div style="margin-bottom: 8px; font-size: 14px;"><strong>Date & Time:</strong> ${date} at ${time}</div>
            <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #6ee7b7;">
              <div style="font-weight: 700; font-size: 13px; color: #065f46; margin-bottom: 8px;">Your Google Meet Room:</div>
              <a href="${meetingLink}" target="_blank" style="background: #059669; color: #ffffff; padding: 10px 20px; font-size: 14px; font-weight: 700; border-radius: 8px; text-decoration: none; display: inline-block;">
                📹 Join Google Meet Room
              </a>
            </div>
          </div>

          <p style="font-size: 14px; color: #64748b;">
            💡 <strong>Preparation Tip:</strong> Please arrive 2 minutes early and have your key questions ready to maximize your session time.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 18px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Jobberman Nigeria · Mastercard Foundation Mentorship Initiative
        </div>
      </div>
    `;
    return this.sendEmail({ to: associateEmail, subject, html });
  },

  /**
   * 3. Triggered when Mentor marks session conducted -> Sent to Associate for Evaluation & Ratings
   */
  async sendEvaluationRequestToAssociate({ associateEmail, associateName, mentorName, sessionId }) {
    const subject = `⭐ How was your session with ${mentorName}? Please submit your evaluation`;
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #fef3c7; margin-bottom: 8px;">Session Conducted</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">Submit Your Mentorship Review</h1>
        </div>

        <div style="padding: 28px; color: #1e293b; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${associateName}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">
            <strong>${mentorName}</strong> has marked your 1-on-1 mentorship session as completed.
          </p>
          <p style="font-size: 15px; color: #475569;">
            Your feedback helps us continuously improve the program and recognize top mentors across the Mastercard Foundation network.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="https://mentorship-jobberman.vercel.app/associate" style="background: #d97706; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 700; border-radius: 50px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(217,119,6,0.3);">
              ⭐ Rate & Review Your Session Now
            </a>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 18px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Jobberman Nigeria · Mastercard Foundation Mentorship Initiative
        </div>
      </div>
    `;
    return this.sendEmail({ to: associateEmail, subject, html });
  },

  /**
   * 4. Triggered 2x monthly for Associates who haven't booked a session in the current month
   */
  async sendMonthlyBookingReminder({ associateEmail, associateName, monthName = "this month" }) {
    const subject = `🚀 Have you booked your mentorship session for ${monthName}?`;
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #1b0a3a 0%, #2e1065 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #ffd700; margin-bottom: 8px;">Mastercard Foundation Associates Program</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">Monthly Mentorship Reminder</h1>
        </div>

        <div style="padding: 28px; color: #1e293b; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${associateName}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">
            This is a friendly reminder that you haven't scheduled your 1-on-1 mentorship session for <strong>${monthName}</strong> yet!
          </p>
          <p style="font-size: 15px; color: #475569;">
            Executive mentors across Software Engineering & AI, Fintech, Public Health, and Climate Strategy have open availability slots ready for you.
          </p>

          <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #6d28d9; margin-bottom: 8px;">Why book early?</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4c1d95;">
              <li style="margin-bottom: 6px;">Secure preferred time slots before they fill up</li>
              <li style="margin-bottom: 6px;">Get personalized guidance on your monthly career objectives</li>
              <li>Track and demonstrate progress in your Mastercard Foundation Fellowship</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0 16px;">
            <a href="https://mentorship-jobberman.vercel.app/associate" style="background: #7c3aed; color: #ffffff; padding: 14px 30px; font-size: 15px; font-weight: 700; border-radius: 50px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(124,58,237,0.35);">
              👉 Find a Mentor & Book Your Session
            </a>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 18px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Jobberman Nigeria · Mastercard Foundation Mentorship Initiative<br/>
          Questions? Contact <a href="mailto:support@jobberman.com" style="color: #2563eb; text-decoration: none;">support@jobberman.com</a>
        </div>
      </div>
    `;
    return this.sendEmail({ to: associateEmail, subject, html });
  }
};
