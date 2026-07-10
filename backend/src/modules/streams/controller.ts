import { listAllStreams } from "./service";

export async function getStreamsController({ set }: any) {
    try {
        const streams = await listAllStreams();
        return {
            message: "List of streams",
            body: streams
        };
    } catch (error: any) {
        console.error("Failed to fetch streams:", error);
        set.status = 500;
        return {
            message: "Failed to fetch streams"
        };
    }
}
