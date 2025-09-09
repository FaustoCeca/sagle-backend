import { Injectable } from "@nestjs/common";
import OpenAi from "openai";
import { PrismaService } from "src/prisma/prisma.service";
import { SagaDB } from "src/sagas/sagas.types";
import { HintDB, HintsObject } from "./hint.types";

@Injectable()
export class HintService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async getHint(sagle: SagaDB): Promise<HintDB[]> {
        try {
            const hints = await this.prisma.hint.findMany({
                where: {
                    sagaId: sagle.id
                }
            });

            if (!hints || hints.length === 0) {
                const generatedHints = await this.generateHint(sagle);

                return generatedHints;
            }

            console.log("Retrieved hints from DB:", hints);

            return hints as HintDB[];
        } catch (error) {
            console.error("Error retrieving hints:", error);
            throw new Error("Failed to retrieve hints");
        }
    }

    async generateHint(sagle: SagaDB): Promise<HintDB[]> {
        try {
            const openai = new OpenAi({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const response = await openai.chat.completions.create({
                model: 'gpt-4.1',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful assistant in a game about guessing video game sagas names. Your job is to return clues about the selected saga of the day. The hint should be a short, concise, and relevant clue that helps users understand the context of the saga title. Once you generate the hint in English, I want you to translate it into Spanish and French and return a JSON with the 3 hints in different languages. The JSON should have the following structure: { "en": "English hint", "es": "Spanish hint", "fr": "French hint" }`
                    },
                    {
                        role: 'user',
                        content: `A person is playing a game about guessing video game sagas, the saga they have to guess is ${sagle.title}, give me a good clue, videogame related, but not so obvious or evident that I can guess it. Dont start the sentence with the word "Hint" or "Hint:`
                    }
                ],
            });

            if (!response.choices[0].message.content || response.choices.length === 0) {
                throw new Error("No response from OpenAI");
            }

            const hintsObject: HintsObject = JSON.parse(response.choices[0].message.content);

            const createdHints = await this.prisma.hint.createManyAndReturn({
                data: [
                    {
                        id: Math.floor(Math.random() * 1000000),
                        text: hintsObject.en,
                        sagaId: sagle.id,
                        language: "en"
                    },
                    {
                        id: Math.floor(Math.random() * 1000000),
                        text: hintsObject.es,
                        sagaId: sagle.id,
                        language: "es"
                    },
                    {
                        id: Math.floor(Math.random() * 1000000),
                        text: hintsObject.fr,
                        sagaId: sagle.id,
                        language: "fr"
                    }
                ]
            });

            return createdHints;
        } catch (error) {
            console.error("Error generating hint:", error);
            throw new Error("Failed to generate hint");
        }
    }

    async deleteHints(): Promise<void> {
        await this.prisma.hint.deleteMany({});
    }
}