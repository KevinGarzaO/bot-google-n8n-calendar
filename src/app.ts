import 'dotenv/config'
import { createBot, MemoryDB } from '@builderbot/bot'
import AIClass from './services/ai';
import flow from './flows';
import { provider } from './provider';

const PORT = process.env.PORT ?? 3001
const ai = new AIClass(process.env.OPEN_API_KEY, 'gpt-3.5-turbo-0125')

const main = async () => {
    const { httpServer, handleCtx } = await createBot({
        database: new MemoryDB(),
        provider,
        flow,
    }, { extensions: { ai } })


    provider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    httpServer(+PORT)
}
main()
