// Create an alphanumeric string of a certain length.
function makeID(length) {
    let result = ''
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let charactersLength = characters.length
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

// Create an alphanumeric string of a certain length. This function checks with KV to see if a link with the same
// streamer and ID already exists.
export async function makeUniqueID(streamer, length) {
    let id
    let isIDValid = false

    // Check if a link with that ID already exists
    while (!isIDValid) {
        id = makeID(length)

        const existing = await LINKS.get(`links:${streamer}:${id}`, {type: 'stream'})
        console.log(`get kv ${streamer}:${id} ${existing}`)
        if (!existing) {
            isIDValid = true
        }
    }

    return id
}

// Simple JavaScript hash - copied from https://stackoverflow.com/a/52171480
export function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i)
        h1 = Math.imul(h1 ^ ch, 2654435761)
        h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909)
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909)
    return(h2>>>0).toString(16).padStart(8,'0')+(h1>>>0).toString(16).padStart(8,'0')
}
