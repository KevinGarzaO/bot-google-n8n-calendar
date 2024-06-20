import { addKeyword, EVENTS } from "@builderbot/bot";
import { getHistory, getHistoryParse, handleHistory } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { getFullCurrentDate } from "src/utils/currentDate";

const PROMPT_SELLER = `Puedes por favor con base al Historial del ultimo mensaje del Customer, 
obtener la intención del interes de la persona, para saber de que habla más facilmente.

### HISTORIAL DE CONVERSACIÓN (Cliente/Vendedor)
{HISTORY}

### INTRUCCIONES
- SOLAMENTE RESPONDE la intención que tiene la persona, no respondas nada mas
- Se breve y practico en tus respuestas
`


export const generatePromptSeller = (history: string, context: any) => {
    const nowDate = getFullCurrentDate()
    return PROMPT_SELLER
        .replace('{HISTORY}', history)
        .replace('{PREGUNTA}', context.body)
};

const ReformQuestion = async (state, context, extensions ) => {
        try {

            const ai = extensions.ai as AIClass
            const lastMessage = getHistory(state).at(-1)
            const history = getHistoryParse(state)
            
         
            const promptInfo = generatePromptSeller(history, context.body)

         
            const response = await ai.createChat([
                {
                    role: 'system',
                    content: promptInfo
                }
            ])

           
            
            

            await handleHistory({ content: response, role: 'assistant' }, state)

            const chunks = response.split(/(?<!\d)\.\s+/g);

            return response;

        } catch (err) {
            console.log(`[ERROR]:`, err)
            return
        }
    }

export { ReformQuestion }