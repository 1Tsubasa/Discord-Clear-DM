const { Client, Permissions } = require ('discord.js-selfbot-v13');
const client = new Client({
    checkUpdate: false,
    autoRedeemNitro: false,
    ws: {
        properties: {
            os: 'Linux',
            browser: 'Discord Client',
            release_channel: 'stable',
            client_version: '1.0.9011',
            os_version: '10.0.22621',
            os_arch: 'x64',
            system_locale: 'en-US',
            client_build_number: 175517,
            native_build_number: 29584,
            client_event_source: null,
            design_id: 0
        }
    }
});
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let DMsCleared = false;
let serverIds = [];
let serverCount = 0;

rl.question('Entrez votre token : ', async (token) => {
    client.on('ready', () => {
        console.log(`Successfully logged in as ${client.user.tag}!`);
	for (let guild of client.guilds.cache.values()) {
            serverIds.push(guild.id);
        }
        startQuestion();
    });

    client.login(token);
});

async function startQuestion() {
    rl.question('Voulez-vous supprimer les DMs, les messages de serveurs, messages du canal ou tous les messages (DM/SERVER/CHANNEL/ALL) ? : ', async (choice) => {
        switch(choice.toUpperCase()) {
            case 'DM':
                clearDMs();
                break;
            case 'SERVER':
               rl.question('Entrez l\'ID du serveur (guildId) : ', async (guildId) => {
                    serverIds = [guildId];
                    clearServerMessages();
                });
                break;
            case 'CHANNEL':
                clearChannelMessages();
                break;
            case 'ALL':
                serverIds = client.guilds.cache.map(guild => guild.id);
                clearAll();
                break;
            default:
                console.log("Choix invalide");
                rl.close();
                return;
        }
    });
}

async function clearChannelMessages() {
    rl.question('Entrez l\'ID du serveur (guildId) : ', async (guildId) => {
        rl.question('Entrez l\'ID du canal (channelId) : ', async (channelId) => {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                console.error('La guilde est introuvable');
                startQuestion();
                return;
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel || !(channel.type === 'GUILD_TEXT')) {
                console.error('Le canal est introuvable ou n\'est pas un canal de texte');
                startQuestion();
                return;
            }

            await deleteMessages(channel);
            startQuestion();
        });
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function deleteMessages(channel) {
    let fetched;
    do {
        fetched = await channel.messages.fetch({ limit: 100 });
        const messagesToDelete = fetched.filter(m => m.author.id === client.user.id);
        let messageCount = 0;
        for(const message of messagesToDelete.values()) {
            await sleep(1000); // Wait for 1 second
            await message.delete()
                .then(() => {
                    messageCount++;
                    console.log(`[${channel.name}]Message supprimé : ${message.id} - [${messageCount}/${messagesToDelete.size}]`);
                })
                .catch(e => console.error('Erreur lors de la suppression du message :', e.message));
        }
    }
    while(fetched.size >= 2);
}

async function clearServerMessages() {
    serverCount = 0;
    for (const guildId of serverIds) {
	
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error("Serveur introuvable");
            serverCount++;
            if (DMsCleared && serverCount === serverIds.length) rl.close();
            continue;
        }

        let BrowseChannels = async (category) => {
            for (let [,channel] of category.children.filter(e => ['GUILD_TEXT','GUILD_VOICE','GUILD_STAGE_VOICE','GUILD_STORE','GUILD_NEWS','GUILD_PUBLIC_THREAD','GUILD_PRIVATE_THREAD','GUILD_NEWS_THREAD'].includes(e.type)).sort((a,b) => a.rawPosition - b.rawPosition)) {
                let canModifyChannel = channel.permissionsFor(guild.members.me).has('VIEW_CHANNEL');
                if (canModifyChannel) await deleteMessages(channel);
            }
        }

        for (let [, channel] of guild.channels.cache.filter(e => e.type === 'GUILD_CATEGORY' && e.permissionsFor(guild.me).has('VIEW_CHANNEL')).sort((a,b) => a.rawPosition - b.rawPosition)) {
            let canModifyChannel = channel.permissionsFor(guild.members.me).has('VIEW_CHANNEL');
            if (canModifyChannel) await BrowseChannels(channel);
        }

        serverCount++;
        if (DMsCleared && serverCount === serverIds.length) rl.close();
    }
    startQuestion();
}


async function clearDMs() {
    rl.question("Entrez l'ID de l'utilisateur avec qui vous voulez supprimer les DMs : ", async (userId) => {
        // trouvez l'utilisateur à partir de l'ID
        const user = client.users.cache.get(userId);
        if (!user) {
            console.error("L'utilisateur n'a pas été trouvé");
            startQuestion();
            return;
        }

        // ouvrez le canal de messagerie directe avec l'utilisateur
        const DMChannel = await user.createDM();

        let messageCount = 0;
        let fetched;

        // tant qu'il y a des messages dans le canal
        do {
            fetched = await DMChannel.messages.fetch({ limit: 100 });
            const messagesToDelete = fetched.filter(m => m.author.id === client.user.id);

            // supprimez chaque message
            for (const message of messagesToDelete.values()) {
                await sleep(1000); // attend de 1 seconde
                await message.delete()
                    .then(() => {
                        messageCount++;
                        console.log(`[${user.username}] Message supprimé : ${message.id} - [${messageCount}/${messagesToDelete.size}]`);
                    })
                    .catch(e => console.error('Erreur lors de la suppression du message :', e.message));
            }
        } while(fetched.size >= 2);

        if (!DMsCleared) {
            DMsCleared = true;
        }

        startQuestion();
    });
}


async function clearAll() {
    DMsCleared = false;

    // Supprimer tous les messages directs
    console.log("Effacement des messages directs...");
    for (let user of client.users.cache.values()) {
        const DMChannel = await user.createDM();
        await deleteMessages(DMChannel);
    }
    DMsCleared = true;

    console.log("Effacement des messages de serveur...");
    serverIds = client.guilds.cache.array().map(guild => guild.id);
    // Supprimer tous les messages de serveur
    await clearServerMessages();
}
