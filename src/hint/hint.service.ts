import { Injectable } from "@nestjs/common";
import OpenAi from "openai";
import { PrismaService } from "src/prisma/prisma.service";
import { SagaDB } from "src/sagas/sagas.types";
import { HintDB } from "./hint.types";

@Injectable()
export class HintService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async getHint(sagle: SagaDB): Promise<any> {
        try {
            const hint = await this.prisma.hint.findFirst({
                where: {
                    sagaId: sagle.id
                }
            });

            if (!hint || hint.text === null || hint.text.trim() === "") {
                const generatedHint = await this.generateHint(sagle);

                return generatedHint;
            }

            return hint;
        } catch (error) {
            console.error("Error retrieving hint:", error);
            throw new Error("Failed to retrieve hint");
        }
    }

    async generateHint(sagle: SagaDB): Promise<HintDB> {
        try {
            const openai = new OpenAi({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const response = await openai.chat.completions.create({
                model: 'gpt-4.1',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful assistant that generates hints for sagle titles. The hint should be a short, concise, and relevant clue that helps users understand the context of the sagle title.`
                    },
                    {
                        role: 'user',
                        content: `A person is playing a game about guessing video game sagas, the saga they have to guess is ${sagle.title}, give me a good clue, videogame related, but not so obvious or evident that I can guess it.`
                    }
                ],
            });

            if (!response.choices[0].message.content || response.choices.length === 0) {
                throw new Error("No response from OpenAI");
            }

            const hint = await this.prisma.hint.create({
                data: {
                    id: Math.floor(Math.random() * 1000000),
                    text: response.choices[0].message.content,
                    sagaId: sagle.id,
                }
            })

            return hint;
        } catch (error) {
            console.error("Error generating hint:", error);
            throw new Error("Failed to generate hint");
        }
    }

    async deleteHint(sagaId: number): Promise<void> {
        const hint = await this.prisma.hint.findFirst({
            where: {
                sagaId: sagaId
            }
        })

        if (!hint) {
            throw new Error("Hint not found");
        }

        await this.prisma.hint.delete({
            where: {
                id: hint.id
            }
        });
    }
}