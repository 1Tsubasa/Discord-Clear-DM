const { Client } = require ('discord.js-selfbot-v13');
const client = new Client({checkUpdate: false, autoRedeemNitro: false, ws: {properties: {os: 'Linux',browser: 'Discord Client',release_channel: 'stable',client_version: '1.0.9011',os_version: '10.0.22621',os_arch: 'x64',system_locale: 'en-US',client_build_number: 175517,native_build_number: 29584,client_event_source: null,design_id: 0,}}});
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Entrez votre token : ', async (token) => {

  client.on('ready', () => {
    console.log(`Successfully logged in as ${client.user.tag}!`);

    rl.question('Entrez l\'ID de l\'utilisateur avec lequel vous souhaitez interagir : ', async (userId) => {
      if (!userId) {
        console.error('ID d\'utilisateur invalide.');
        rl.close();
        return;
      }

      // Récupérer le canal DM
      const DMChannel = await client.users.fetch(userId).then(user => user.createDM());
      // Vérifier si le canal a été correctement récupéré
      if (!DMChannel) {
        console.error('Le canal DM spécifié n\'existe pas ou n\'a pas été chargé.');
        rl.close();
        return;
      }

      // Récupérer les messages du canal DM
      const messages = await DMChannel.messages.fetch().catch(() => false);

      if (!messages) {
        console.error('Impossible de récupérer les messages du canal DM.');
        rl.close();
        return;
      }

      let count = 0;
      for (let [messageId, message] of messages) {
        // Vérifier si le message a été envoyé par l'utilisateur spécifique
        if (message.author.id === client.user.id) {
          // Supprimer le message
          await message.delete().catch(error => console.error(`Erreur lors de la suppression du message ${messageId}:`, error));
          count++;
          console.log(`Message supprimé : ${message.content} - ${message.createdAt} - ${message.id} - [${count}]`);
        }
      }

      console.log(`Nombre de messages supprimés : ${count}`);
      rl.close();
    });
  });

  client.login(token);
});




