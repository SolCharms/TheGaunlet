import { PublicKey } from '@solana/web3.js';

type SubmissionConfig = {
    challenge: PublicKey,
    content: string,
}

// User 1
export const submissionConfig: SubmissionConfig =
    {
        challenge: new PublicKey("4QfsnQPnzfN6GscPF4am4JV43mnpsYysTRCX1zTZQECD"),
        content: "Built something cool for #SolanaU #SolanaKR. \n" + "https://twitter.com/CharmsSol/status/1661171281369219074",
    }










































// export const submissionConfig: SubmissionConfig =
//     {
//         challenge: new PublicKey("2McumLahaekRUURWHmGEvF1i9pL5F29gveXFdTgyTiSn"),
//         content: "This thread was part of the initial inspiration for @xAndriaOnchain.\n\n" +
//             "It begs the bigger question: How can we use crypto tech to display ownership outside the current transactional realm? Beyond NFTs & Tokens.\n" +
//             "https://twitter.com/AlanaDLevin/status/1601636132139081729",
//         contentDataUrl: "https://twitter.com/xAndriaOnchain/status/1651065837640351745?s=20",
//     }
