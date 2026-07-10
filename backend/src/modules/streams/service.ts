import { findAllStreams } from "./repository";

export async function listAllStreams() {
    return await findAllStreams();
}
