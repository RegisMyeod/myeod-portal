/**
 * slack-config.js
 * Configuration Webhook Slack pour notifications
 */

const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';

/**
 * Envoyer une notification Slack
 */
async function sendSlackNotification(message) {
  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message.text,
        blocks: message.blocks || undefined,
        attachments: message.attachments || undefined,
      })
    });

    if (!response.ok) {
      console.error('Erreur Slack:', response.statusText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Erreur sendSlackNotification:', err);
    return false;
  }
}

/**
 * Notifier demande réinitialisation mot de passe
 */
async function notifyPasswordResetRequest(userEmail, reason = '', lang = 'fr') {
  const timestamp = new Date().toLocaleString('fr-FR');
  
  const message = {
    text: lang === 'fr'
      ? `🔐 Demande réinitialisation mot de passe : ${userEmail}`
      : `🔐 Password reset request: ${userEmail}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: lang === 'fr' ? '🔐 Demande réinitialisation mot de passe' : '🔐 Password Reset Request',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*${lang === 'fr' ? 'Email' : 'Email'}:*\n${userEmail}`
          },
          {
            type: 'mrkdwn',
            text: `*${lang === 'fr' ? 'Date/Heure' : 'Date/Time'}:*\n${timestamp}`
          }
        ]
      },
      reason ? {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${lang === 'fr' ? 'Raison' : 'Reason'}:*\n${reason}`
        }
      } : null,
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: lang === 'fr'
            ? '📝 Vérifier l\'identité et réinitialiser le mot de passe dans Supabase Dashboard'
            : '📝 Verify identity and reset password in Supabase Dashboard'
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: lang === 'fr' ? 'Demande automatique via MyEOD Portal' : 'Automatic request from MyEOD Portal'
          }
        ]
      }
    ]
  };

  // Filtrer les null
  message.blocks = message.blocks.filter(b => b !== null);

  return await sendSlackNotification(message);
}

// Exporter pour utilisation
window.MyEODSlack = {
  sendSlackNotification,
  notifyPasswordResetRequest
};
