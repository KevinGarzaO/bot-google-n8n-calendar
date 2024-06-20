import { addKeyword, EVENTS } from "@builderbot/bot";
import { generateTimer } from "../utils/generateTimer";
import { getHistory, getHistoryParse, handleHistory } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { getFullCurrentDate } from "src/utils/currentDate";
import { pdfQuery } from "src/services/pdf";
import { ReformQuestion } from "./ReformQuestion.flow";
import * as fs from 'fs';

const PROMPT_SELLER = `Como experto en ventas con aproximadamente 15 años de experiencia en embudos de ventas y generación de leads, tu tarea es mantener una conversación agradable, responder a las preguntas del cliente sobre nuestros productos y, finalmente, guiarlos para reservar una cita. Tus respuestas deben basarse únicamente en el contexto proporcionado:

### DÍA ACTUAL
{CURRENT_DAY}

### HISTORIAL DE CONVERSACIÓN (Cliente/Vendedor)
{HISTORY}

### BASE DE DATOS
{DATABASE}

Para proporcionar respuestas más útiles, puedes utilizar la información proporcionada en la base de datos. El contexto es la única información que tienes. Ignora cualquier cosa que no esté relacionada con el contexto.

### EJEMPLOS DE RESPUESTAS IDEALES:

- buenas bienvenido a..
- un gusto saludarte en..
- por supuesto tenemos eso y ...

### INTRUCCIONES
- Mantén un tono profesional y siempre responde en primera persona.
- NO ofrescas promociones que no existe en la BASE DE DATOS
- Finaliza la conversacion con CTA como por ejemplo ¿Te gustaria agendar un cita? o por ejemplo ¿Quieres reservas una cita?"+
- Continua la conversacion sin saludar en primera persona

Respuesta útil adecuadas para enviar por WhatsApp (en español):`


export const generatePromptSeller = (history: string, database: string) => {
    const nowDate = getFullCurrentDate()
    console.log("Now DATE", nowDate)
    return PROMPT_SELLER
        .replace('{HISTORY}', history)
        .replace('{CURRENT_DAY}', nowDate)
        .replace('{DATABASE}', database)
};



const flowSeller = addKeyword(EVENTS.ACTION)
    .addAction(async (_, { state, flowDynamic, extensions }) => {
        try {

            const ai = extensions.ai as AIClass
            const lastMessage = getHistory(state).at(-1)
            const history = getHistoryParse(state)
            
            const intInfo = (await ReformQuestion(state, _, extensions)).toString();  

             // Ejemplo de uso de la función
             let promptInfo;
             let dataBase;
             let data;
             let informacionBuscada = buscarInformacion(intInfo);
             if(informacionBuscada != null){
                console.log("ORIGEN JSON");
                informacionBuscada = informacionBuscada + 
                "### INTRUCCIONES"+
"- Mantén un tono profesional y siempre responde en primera persona."+
"- NO ofrescas promociones que no existe en la BASE DE DATOS"+
"- Finaliza la conversacion con CTA como por ejemplo ¿Te gustaria agendar un cita? o por ejemplo ¿Quieres reservas una cita?"+
"- Continua la conversacion sin saludar en primera persona"

                promptInfo = generatePromptSeller(history, informacionBuscada)
             }else{
                dataBase = await pdfQuery(intInfo)
                console.log("ORIGEN PDF");
                promptInfo = generatePromptSeller(history, dataBase)

                // GUARDA INFORMACIÓN EN JSON
             data = {
                "intencion": intInfo,
                "informacion": dataBase
            };

            let datosActuales = JSON.parse(fs.readFileSync('objeto.json', 'utf8'));
            datosActuales.mensajes.push(data);
            const jsonData = JSON.stringify(datosActuales, null, 2);
            fs.writeFileSync('objeto.json', jsonData, 'utf8');

             }
            
            
                
            

           

            const response = await ai.createChat([
                {
                    role: 'system',
                    content: promptInfo
                }
            ])

            await handleHistory({ content: response, role: 'assistant' }, state)

            const chunks = response.split(/(?<!\d)\.\s+/g);

            for (const chunk of chunks) {
                await flowDynamic([{ body: chunk.trim(), delay: generateTimer(150, 250) }]);
            }
        } catch (err) {
            console.log(`[ERROR]:`, err)
            return
        }
    })


    
    // Función para buscar la intención deseada
function buscarInformacion(intencionBuscada: string) {
    const rawData = fs.readFileSync('objeto.json', 'utf8');
    const jsonData = JSON.parse(rawData);
    const mensajes = jsonData.mensajes;
    
    for (const mensaje of mensajes) {
        if (mensaje.intencion === intencionBuscada) {
            return mensaje.informacion;
        }
    }
    return null;
}


export { flowSeller }