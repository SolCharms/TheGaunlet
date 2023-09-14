import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Tags } from '../../challenger.client';

type ChallengeConfig = {
    crux: PublicKey,
    title: string,
    content: string,
    contentDataUrl: string,
    tags: Tags[],
    challengesExpiresTs: BN,
    reputation: BN
}

type ChallengeConfigBulk = {
    challengeConfigs : ChallengeConfig[]
}

export const challengeConfigBulk: ChallengeConfigBulk =
    {
        challengeConfigs: [
            {
                crux: new PublicKey("4vuXvDf1YVcqyGEyi6pDeA2eamMpULVVoX4ueimDg8kt"),
                title: "Challenge 5", // by @0xCleon
                content: "Post a tweet with the hashtags #SolanaU #SolanaKR",
                contentDataUrl: "https://dev-challenger.solanau.org/events/e5e188fb-cf3d-4fcf-92a3-105dda7ad062/challenges",
                tags: [{social: {}} as never],
                challengesExpiresTs: new BN(1703480400), // Christmas Day 0:00:00 2023
                reputation: new BN(9001)
            },
            {
                crux: new PublicKey("4vuXvDf1YVcqyGEyi6pDeA2eamMpULVVoX4ueimDg8kt"),
                title: "Challenge 8", // by @realbuffalojoe
                content: "Learn about custom account data on Solana",
                contentDataUrl: "https://dev-challenger.solanau.org/events/e5e188fb-cf3d-4fcf-92a3-105dda7ad062/challenges",
                tags: [{video: {}} as never],
                challengesExpiresTs: new BN(1703480400), // Christmas Day 0:00:00 2023
                reputation: new BN(10_000)
            },
            {
                crux: new PublicKey("4vuXvDf1YVcqyGEyi6pDeA2eamMpULVVoX4ueimDg8kt"),
                title: "Challenge 25", // by @DonnySolana
                content: "Learn about phantom deeplinks for mobile wallets.",
                contentDataUrl: "https://dev-challenger.solanau.org/events/e5e188fb-cf3d-4fcf-92a3-105dda7ad062/challenges",
                tags: [{wallets: {}} as never],
                challengesExpiresTs: new BN(1703480400), // Christmas Day 0:00:00 2023
                reputation: new BN(10_000)
            },
        ]
    }

export const challengeConfig: ChallengeConfig =
    {
        crux: new PublicKey("4vuXvDf1YVcqyGEyi6pDeA2eamMpULVVoX4ueimDg8kt"),
        title: "Challenge #5",
        content: "Post a tweet with the hashtags #SolanaU #SolanaKR",
        contentDataUrl: "https://dev-challenger.solanau.org/events/e5e188fb-cf3d-4fcf-92a3-105dda7ad062/challenges",
        tags: [{social: {}} as never],
        challengesExpiresTs: new BN(1703480400), // Christmas Day 0:00:00 2023
        reputation: new BN(9000)
    }

// export const challengeConfig: ChallengeConfig =
//     {
//         crux: new PublicKey("BepEX72NieLr2cKHYa5sfTNXhWBTMCTUYVJBVoa5gJ9L"),
//         title: "Challenge 8",
//         content: "Learn about custom account data on Solana",
//         contentDataUrl: "https://dev-challenger.solanau.org/events/e5e188fb-cf3d-4fcf-92a3-105dda7ad062/challenges",
//         tags: [{video: {}} as never],
//         challengesExpiresTs: new BN(1703480400), // Christmas Day 0:00:00 2023
//         reputation: new BN(10_000)
//     }
