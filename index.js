const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

const stage = {}; // حالة كل زبون

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state,
    browser: ['MediaTown', 'Chrome', '1.0.0']
  });

  sock.ev.on('connection.update', ({ connection, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'open') console.log('✅ الاتصال ناجح');
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    console.log(`💬 رسالة من ${sender}: ${text}`);

    const userStage = stage[sender] || 'first_contact';

    if (userStage === 'first_contact') {
      stage[sender] = 'waiting_yes';
      await sock.sendMessage(sender, {
        text: 'اهلا وسهلا يسعد اوقاتك ، حابب تعمل اغنية لمشروعك؟'
      });
      return;
    }

    if (userStage === 'waiting_yes' && /(اه|نعم|اكي|تمام|بدي|حاب)/i.test(text)) {
      stage[sender] = 'waiting_sample_reply';
      await sock.sendMessage(sender, {
        text: 'خيار ممتاز انك تعمل اعلان مغنى لان الاغنية افضل وسيلة اعلانية بتعلق في راس الناس وممكن تعمل ترند وتنقل المشروع لمكان ممتاز انشاء الله، بتحب تسمع اشي من اعمالنا لزباين سابقين؟'
      });
      return;
    }

    if (userStage === 'waiting_sample_reply' && /(اه|نعم|ياريت|بصير|اوكي|تمام)/i.test(text)) {
      stage[sender] = 'waiting_cost_question';

      const fs = require('fs');

for (let i = 1; i <= 7; i++) {
  const audioPath = `./media/ad${i}.mp3`;
  if (fs.existsSync(audioPath)) {
    await sock.sendMessage(sender, {
      audio: { url: audioPath },
      mimetype: 'audio/mpeg',
      ptt: false
    });
  }
}

      await sock.sendMessage(sender, {
        text: `🎬 وفي عنا كمان اعمال بنعملهم مع مونتاج فيديو مثل هيك:\nhttps://youtu.be/yourvideo1\nhttps://youtu.be/yourvideo2`
      });

      await sock.sendMessage(sender, {
        text: 'كل مشروع بنعمله كلمات والحان بستايل مختلف حسب ذوق الزبون ومتطلبات ونوع المشروع، عشان حقوق الملكية كمان.'
      });

      return;
    }

    if (userStage === 'waiting_cost_question' && /(كم|التكلفة|سعر|بكلف|بقديش)/i.test(text)) {
      stage[sender] = 'waiting_project_info';
      await sock.sendMessage(sender, {
        text: `عنا طريقتين للإنتاج:\n\n🎼 1. احترافية (300 دينار): بيشارك فيها 8-10 اشخاص من ملحنين، كُتّاب، موزعين، مغنيين، مهندسين، وستوديو.\n\n🤖 2. مع الذكاء الاصطناعي (150 دينار): الكلمات من فريقنا، الغناء من مغنيينا، لكن اللحن من الذكاء الاصطناعي (ما بنقدر نتحكم فيه مثل الاحترافي).`
      });
      return;
    }

    if (userStage === 'waiting_project_info' && text.length > 20) {
      stage[sender] = 'done';

      await sock.sendMessage(sender, {
        text: '👌 تمام رح نبدأ نحضر الكلمات، بنرجع نحكي معك خلال وقت قصير.'
      });

      // ابعتلك إشعار شخصي على رقمك
      await sock.sendMessage('972599108819@s.whatsapp.net', {
        text: `📣 زبون جدي جاهز للتنفيذ!\nرقمه: ${sender}\nنص رسالته:\n${text}`
      });

      return;
    }

    if (!stage[sender] || stage[sender] === 'done') {
      stage[sender] = 'first_contact';
      await sock.sendMessage(sender, {
        text: 'اهلا وسهلا يسعد اوقاتك ، حابب تعمل اغنية لمشروعك؟'
      });
    }
  });
};

startBot();
