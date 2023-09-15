import { ChallengerClient, Tags } from './challenger.client';
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { promises as fs } from 'fs';
import { default as yargs } from 'yargs';
import * as anchor from '@coral-xyz/anchor';
import { IDL as ChallengerIDL } from './challenger.types';
import { CHALLENGER_PROG_ID } from './index';
import { stringifyPKsAndBNs } from './render-types';
import { findCruxAuthorityPDA } from './challenger.pda';
import { CruxFees, SubmissionState } from './challenger.client';
import { hash } from 'blake3';

import { networkConfig } from "./cli_configs/devnet/networkConfig";
import { cruxConfig } from "./cli_configs/devnet/cruxConfig";
import { challengeConfig, challengeConfigBulk } from "./cli_configs/devnet/challengeConfig";
import { submissionConfig } from "./cli_configs/devnet/submissionConfig";

// ----------------------------------------------- Legend ---------------------------------------------------------

// -a submission accepted (accepted)
// -c challenge account address (comment)
// -k pubkey of account being fetched (key)
// -m crux manager account address (manager)
// -o user profile owner address (owner)
// -p user profile account address (profile)
// -r receiver account address (receiver)
// -s submission account address (submission)
// -t token mint address (minT)
// -u unix timestamp (unix)
// -x crux account address (cruX)
// -z dryRun



const parser = yargs(process.argv.slice(2)).options({
    dryRun: {
        alias: 'z',
        type: 'boolean',
        default: false,
        description: 'set Dry Run flag'
    },
})



// --------------------------------------------- forum manager instructions ---------------------------------------------



// Initialize crux account (payer = crux manager)
// Must config crux parameters in cruxConfig
    .command('init-crux', 'Initialize a crux account', {
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const crux = Keypair.generate();
                 const cruxFees: CruxFees = cruxConfig.cruxFees;

                 if (!argv.dryRun) {
                     const cruxInstance = await challengerClient.initCrux(
                         crux,
                         wallet.payer,
                         cruxFees,
                     );
                     console.log(stringifyPKsAndBNs(cruxInstance));
                 } else {
                     console.log('Initializing crux account with account pubkey', stringifyPKsAndBNs(crux));
                 }
             })



// Update crux parameters
// Must config crux parameters in cruxConfig
    .command('update-crux-params', 'Update crux parameters', {
        cruxPubkey: {
            alias: 'x',
            type: 'string',
            demandOption: true,
            description: 'crux account pubkey'
        },
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const cruxClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const cruxKey = new PublicKey(argv.cruxPubkey);
                 const cruxFees: CruxFees = cruxConfig.cruxFees;

                 if (!argv.dryRun) {
                     const updateCruxParamsInstance = await cruxClient.updateCruxParams(
                         cruxKey,
                         wallet.payer,
                         cruxFees,
                     );
                     console.log(stringifyPKsAndBNs(updateCruxParamsInstance));
                 } else {
                     console.log('Updating crux parameters of crux account with pubkey', cruxKey.toBase58());
                 }
             })



// Payout from treasury
    .command('payout-from-treasury', 'Payout from treasury', {
        cruxPubkey: {
            alias: 'x',
            type: 'string',
            demandOption: true,
            description: 'crux account pubkey'
        },
        receiverPubkey: {
            alias: 'r',
            type: 'string',
            demandOption: false,
            description: 'receiver account pubkey for reclaimed rent lamports'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const cruxClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const rentBytes: number = 16;

                 const cruxKey = new PublicKey(argv.cruxPubkey);
                 const receiverKey: PublicKey = argv.receiverPubkey? new PublicKey(argv.receiverPubkey) : wallet.publicKey;
                 const minimumBalanceForRentExemption: anchor.BN = new anchor.BN(await rpcConn.getMinimumBalanceForRentExemption(rentBytes));

                 console.log('Minimum balance for rent exemption for a data size of', rentBytes,
                             'bytes is: ', stringifyPKsAndBNs(minimumBalanceForRentExemption));

                 if (!argv.dryRun) {
                     const payoutInstance = await cruxClient.payoutFromTreasury(
                         cruxKey,
                         wallet.payer,
                         receiverKey,
                     );
                     console.log(stringifyPKsAndBNs(payoutInstance));
                 } else {
                     console.log('Paying out from treasury of crux account with pubkey', cruxKey.toBase58());
                 }
             })



// Close crux
    .command('close-crux', 'Close a crux account', {
        cruxPubkey: {
            alias: 'x',
            type: 'string',
            demandOption: true,
            description: 'crux account pubkey'
        },
        receiverPubkey: {
            alias: 'r',
            type: 'string',
            demandOption: false,
            description: 'receiver account pubkey for reclaimed rent lamports'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const cruxClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const cruxKey: PublicKey = new PublicKey(argv.cruxPubkey);
                 const receiverKey: PublicKey = argv.receiverPubkey ? new PublicKey(argv.receiverPubkey) : wallet.publicKey;

                 if (!argv.dryRun) {
                     const closeCruxInstance = await cruxClient.closeCrux(
                         cruxKey,
                         wallet.payer,
                         receiverKey,
                     );
                     console.log(stringifyPKsAndBNs(closeCruxInstance));
                 } else {
                     console.log('Closing crux account with pubkey:', cruxKey.toBase58());
                 }
             })



// ---------------------------------------------- user profile instructions ------------------------------------------



// Create user profile account (payer = profile owner)
    .command('create-profile', 'Create a user profile account', {
        cruxPubkey: {
            alias: 'x',
            type: 'string',
            demandOption: true,
            description: 'crux account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const cruxClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const cruxKey = new PublicKey(argv.cruxPubkey);

                 if (!argv.dryRun) {
                     const profileInstance = await cruxClient.createUserProfile(
                         cruxKey,
                         wallet.payer,
                     );
                     console.log(stringifyPKsAndBNs(profileInstance));
                 } else {
                     console.log('Creating user profile account for wallet with pubkey', stringifyPKsAndBNs(wallet.publicKey));
                 }
             })



// Edit user profile account
    .command('edit-profile', 'Edit a user profile account', {
        cruxPubkey: {
            alias: 'x',
            type: 'string',
            demandOption: true,
            description: 'crux account pubkey'
        },
        tokenMint: {
            alias: 't',
            type: 'string',
            demandOption: true,
            description: 'token mint account address'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const cruxClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const cruxKey = new PublicKey(argv.cruxPubkey);
                 const tokenMintKey = new PublicKey(argv.tokenMint);

                 if (!argv.dryRun) {
                     const editInstance = await cruxClient.editUserProfile(
                         cruxKey,
                         wallet.payer,
                         tokenMintKey,
                     );
                     console.log(stringifyPKsAndBNs(editInstance));
                 } else {
                     console.log('Editing user profile account for wallet with pubkey', stringifyPKsAndBNs(wallet.publicKey));
                 }
             })



// Delete user profile account
    .command('delete-profile', 'Delete a user profile account', {
        cruxPubkey: {
            alias: 'x',
            type: 'string',
            demandOption: true,
            description: 'crux account pubkey'
        },
        receiverPubkey: {
            alias: 'r',
            type: 'string',
            demandOption: false,
            description: 'receiver account pubkey for reclaimed rent lamports'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const cruxClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const cruxKey: PublicKey = new PublicKey(argv.cruxPubkey);
                 const receiverKey: PublicKey = argv.receiverPubkey ? new PublicKey(argv.receiverPubkey) : wallet.publicKey;

                 if (!argv.dryRun) {
                     const deleteInstance = await cruxClient.deleteUserProfile(
                         cruxKey,
                         wallet.payer,
                         receiverKey,
                     );
                     console.log(stringifyPKsAndBNs(deleteInstance));
                 } else {
                     console.log('Deleting user profile account for wallet with pubkey', stringifyPKsAndBNs(wallet.publicKey));
                 }
             })



// Add moderator privilege to a user profile account
    .command('add-moderator', 'Add moderator privilege to a user profile account', {
        userProfilePubkey: {
            alias: 'p',
            type: 'string',
            demandOption: true,
            description: 'user profile account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const userProfileKey = new PublicKey(argv.userProfilePubkey);

                 if (!argv.dryRun) {
                     const addModeratorInstance = await challengerClient.addModerator(
                         userProfileKey,
                         wallet.payer,
                     );
                     console.log(stringifyPKsAndBNs(addModeratorInstance));
                 } else {
                     console.log('Adding moderator privilege to user profile account with address', userProfileKey.toBase58());
                 }
             })



// Remove moderator privilege from a user profile account
    .command('remove-moderator', 'Remove moderator privilege from a user profile account', {
        userProfilePubkey: {
            alias: 'p',
            type: 'string',
            demandOption: true,
            description: 'user profile account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const userProfileKey = new PublicKey(argv.userProfilePubkey);

                 if (!argv.dryRun) {
                     const removeModeratorInstance = await challengerClient.removeModerator(
                         userProfileKey,
                         wallet.payer,
                     );
                     console.log(stringifyPKsAndBNs(removeModeratorInstance));
                 } else {
                     console.log('Removing moderator privilege from user profile account with address', userProfileKey.toBase58());
                 }
             })



// -------------------------------------------------- managing challenges instructions ------------------------------------------



// Create Challenge
// Must config challenge parameters in challengeConfig
    .command('create-challenge', 'Create Challenge', {
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const cruxKey: PublicKey = challengeConfig.crux;
                 const title: string = challengeConfig.title;
                 const contentString: string = challengeConfig.content;
                 const contentDataUrl: string = challengeConfig.contentDataUrl;
                 const tags: Tags[] = challengeConfig.tags;
                 const challengeExpiresTs = challengeConfig.challengesExpiresTs;
                 const reputation = challengeConfig.reputation;

                 const hashResult = hash(contentString);
                 const contentDataHash: PublicKey = new PublicKey(hashResult);

                 console.log('The content data hash pubkey is: ', stringifyPKsAndBNs(contentDataHash));

                 if (!argv.dryRun) {
                     const challengeInstance = await challengerClient.createChallenge(
                         cruxKey,
                         wallet.payer,
                         contentDataHash,
                         title,
                         contentDataUrl,
                         tags,
                         challengeExpiresTs,
                         reputation,
                     );
                     console.log(stringifyPKsAndBNs(challengeInstance));
                 } else {
                     console.log('Creating challenge for crux with pubkey', stringifyPKsAndBNs(cruxKey));
                 }
             })



// Edit challenge
// Must config challenge parameters in challengeConfig
    .command('edit-challenge', 'Edit challenge', {
        challengePubkey: {
            alias: 'c',
            type: 'string',
            demandOption: true,
            description: 'challenge account pubkey'
        },
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const challengeKey = new PublicKey(argv.challengePubkey);

                 const newTitle: string = challengeConfig.title;
                 const newContentString: string = challengeConfig.content;
                 const newContentDataUrl: string = challengeConfig.contentDataUrl;
                 const newTags: Tags[] = challengeConfig.tags;
                 const newChallengeExpiresTs = challengeConfig.challengesExpiresTs;
                 const newReputation = challengeConfig.reputation;

                 const hashResult = hash(newContentString);
                 const newContentDataHash: PublicKey = new PublicKey(hashResult);

                 if (!argv.dryRun) {
                     const editChallengeInstance = await challengerClient.editChallenge(
                         challengeKey,
                         wallet.payer,
                         newContentDataHash,
                         newTitle,
                         newContentDataUrl,
                         newTags,
                         newChallengeExpiresTs,
                         newReputation,
                     );
                     console.log(stringifyPKsAndBNs(editChallengeInstance));
                 } else {
                     console.log('Editing challenge with account address', challengeKey.toBase58());
                 }
             })



// Delete challenge
    .command('delete-challenge', 'Delete challenge', {
        challengePubkey: {
            alias: 'c',
            type: 'string',
            demandOption: true,
            description: 'challenge account pubkey'
        },
        receiverPubkey: {
            alias: 'r',
            type: 'string',
            demandOption: false,
            description: 'receiver account pubkey for reclaimed rent lamports'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const challengeKey = new PublicKey(argv.challengePubkey);
                 const receiverKey: PublicKey = argv.receiverPubkey ? new PublicKey(argv.receiverPubkey) : wallet.publicKey;

                 if (!argv.dryRun) {
                     const deleteChallengeInstance = await challengerClient.deleteChallenge(
                         challengeKey,
                         wallet.payer,
                         receiverKey,
                     );
                     console.log(stringifyPKsAndBNs(deleteChallengeInstance));
                 } else {
                     console.log('Deleting challenge with account address', challengeKey.toBase58());
                 }
             })



// Create challenges bulk
// Must config challenge parameters in challengeConfig
    .command('create-challenges-bulk', 'Create multiple challenges', {
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const length = challengeConfigBulk.challengeConfigs.length;

                 if (!argv.dryRun) {

                     for (let num = 0; num < length; num++) {

                         const cruxKey: PublicKey = challengeConfigBulk.challengeConfigs[num].crux;
                         const title: string = challengeConfigBulk.challengeConfigs[num].title;
                         const contentString: string = challengeConfigBulk.challengeConfigs[num].content;
                         const contentDataUrl: string = challengeConfigBulk.challengeConfigs[num].contentDataUrl;
                         const tags: Tags[] = challengeConfigBulk.challengeConfigs[num].tags;
                         const challengeExpiresTs = challengeConfigBulk.challengeConfigs[num].challengesExpiresTs;
                         const reputation = challengeConfigBulk.challengeConfigs[num].reputation;

                         const hashResult = hash(contentString);
                         const contentDataHash: PublicKey = new PublicKey(hashResult);

                         console.log('The content data hash pubkey is: ', stringifyPKsAndBNs(contentDataHash));

                         const challengeInstance = await challengerClient.createChallenge(
                             cruxKey,
                             wallet.payer,
                             contentDataHash,
                             title,
                             contentDataUrl,
                             tags,
                             challengeExpiresTs,
                             reputation,
                         );
                         console.log(stringifyPKsAndBNs(challengeInstance));
                     }
                 } else {
                     console.log('Creating challenges in bulk');
                 }
             })



// Create Submission
// Must config submission parameters in submissionConfig
    .command('create-submission', 'Create Submission', {
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const challengeKey: PublicKey = submissionConfig.challenge;
                 const contentString: string = submissionConfig.content;

                 const hashResult = hash(contentString);
                 const contentDataHash: PublicKey = new PublicKey(hashResult);

                 console.log('The content data hash pubkey is: ', stringifyPKsAndBNs(contentDataHash));

                 if (!argv.dryRun) {
                     const submissionInstance = await challengerClient.createSubmission(
                         challengeKey,
                         wallet.payer,
                         contentDataHash,
                     );
                     console.log(stringifyPKsAndBNs(submissionInstance));
                 } else {
                     console.log('Creating submission for challenge with account address', stringifyPKsAndBNs(challengeKey));
                 }
             })



// Edit submission
// Must config submission parameters in submissionConfig
    .command('edit-submission', 'Edit submission', {
        submissionPubkey: {
            alias: 's',
            type: 'string',
            demandOption: true,
            description: 'submission account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const submissionKey: PublicKey = new PublicKey(argv.submissionPubkey);

                 const newContentString: string = submissionConfig.content;
                 const hashResult = hash(newContentString);
                 const newContentDataHash: PublicKey = new PublicKey(hashResult);

                 if (!argv.dryRun) {
                     const editSubmissionInstance = await challengerClient.editSubmission(
                         submissionKey,
                         wallet.payer,
                         newContentDataHash,
                     );
                     console.log(stringifyPKsAndBNs(editSubmissionInstance));
                 } else {
                     console.log('Editing submission with account address', stringifyPKsAndBNs(submissionKey));
                 }
             })



// Delete submission
    .command('delete-submission', 'Delete submission', {
        submissionPubkey: {
            alias: 's',
            type: 'string',
            demandOption: true,
            description: 'submission account pubkey'
        },
        receiverPubkey: {
            alias: 'r',
            type: 'string',
            demandOption: false,
            description: 'receiver account pubkey for reclaimed rent lamports'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const submissionKey = new PublicKey(argv.submissionPubkey);
                 const receiverKey: PublicKey = argv.receiverPubkey ? new PublicKey(argv.receiverPubkey) : wallet.publicKey;

                 if (!argv.dryRun) {
                     const deleteSubmissionInstance = await challengerClient.deleteSubmission(
                         submissionKey,
                         wallet.payer,
                         receiverKey
                     );
                     console.log(stringifyPKsAndBNs(deleteSubmissionInstance));
                 } else {
                     console.log('Deleting submission with account address', submissionKey.toBase58());
                 }
             })



// Delete submission moderator
    .command('delete-submission-moderator', 'Delete submission moderator', {
        submissionPubkey: {
            alias: 's',
            type: 'string',
            demandOption: true,
            description: 'submission account pubkey'
        },
        receiverPubkey: {
            alias: 'r',
            type: 'string',
            demandOption: false,
            description: 'receiver account pubkey for reclaimed rent lamports'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const submissionKey = new PublicKey(argv.submissionPubkey);
                 const receiverKey: PublicKey = argv.receiverPubkey ? new PublicKey(argv.receiverPubkey) : wallet.publicKey;

                 if (!argv.dryRun) {
                     const deleteSubmissionInstance = await challengerClient.deleteSubmissionModerator(
                         submissionKey,
                         wallet.payer,
                         receiverKey
                     );
                     console.log(stringifyPKsAndBNs(deleteSubmissionInstance));
                 } else {
                     console.log('Moderator deleting submission with account address', submissionKey.toBase58());
                 }
             })



// Evaluate Submission
    .command('evaluate-submission', 'Evaluate submission', {
        submissionPubkey: {
            alias: 's',
            type: 'string',
            demandOption: true,
            description: 'submission account pubkey'
        },
        submissionCompleted: {
            alias: 'a',
            type: 'boolean',
            demandOption: true,
            description: 'submission state flag: true = submissionState::Completed, false = submissionState::Rejected'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const submissionKey = new PublicKey(argv.submissionPubkey);
                 const submissionState: SubmissionState = argv.submissionCompleted ? {completed: {} as never} : {rejected: {} as never};

                 if (!argv.dryRun) {
                     const acceptSubmissionInstance = await challengerClient.evaluateSubmission(
                         submissionKey,
                         wallet.payer,
                         submissionState,
                     );
                     console.log(stringifyPKsAndBNs(acceptSubmissionInstance));
                 } else {
                     console.log('Accepting submission with account address', submissionKey.toBase58());
                 }
             })



    .command('close-account', 'Close PDA account', {
        accountPubkey: {
            alias: 'k',
            type: 'string',
            demandOption: true,
            description: 'account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const accountKey: PublicKey = new PublicKey(argv.accountPubkey);

                 if (!argv.dryRun) {

                     const closeAccountInstance = await challengerClient.closeAccount(
                         wallet.payer,
                         accountKey
                     );
                     console.log(stringifyPKsAndBNs(closeAccountInstance));
                 } else {
                     console.log('Closing account with pubkey:', accountKey.toBase58());
                 }
             })



// -------------------------------------------------- PDA account fetching instructions ------------------------------------------



// Fetch all crux PDAs for a given manager and display their account info
// Pass in manager pubkey or will default to pubkey of keypair path in networkConfig.ts
    .command('fetch-all-cruxs', 'Fetch all crux PDA accounts info', {
        managerPubkey: {
            alias: 'm',
            type: 'string',
            demandOption: false,
            description: 'crux manager pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 if (argv.managerPubkey) {

                     const managerKey: PublicKey = new PublicKey(argv.managerPubkey);

                     if (!argv.dryRun) {
                         console.log('Fetching all crux PDAs for manager with pubkey:', managerKey.toBase58());
                         const cruxPDAs = await challengerClient.fetchAllCruxPDAs(managerKey);

                         // Loop over all PDAs and display account info
                         for (let num = 1; num <= cruxPDAs.length; num++) {
                             console.log('Crux account', num, ':');
                             console.dir(stringifyPKsAndBNs(cruxPDAs[num - 1]), {depth: null});
                         }

                     } else {
                         console.log('Found a total of n crux PDAs for manager pubkey:', managerKey.toBase58());
                     }
                 } else {
                     if (!argv.dryRun) {
                         console.log('Fetching all crux PDAs');
                         const cruxPDAs = await challengerClient.fetchAllCruxPDAs();

                         // Loop over all PDAs and display account info
                         for (let num = 1; num <= cruxPDAs.length; num++) {
                             console.log('Crux account', num, ':');
                             console.dir(stringifyPKsAndBNs(cruxPDAs[num - 1]), {depth: null});
                         }

                     } else {
                         console.log('Found a total of n crux PDAs');
                     }
                 }
             })



// Fetch crux PDA by Pubkey
// Crux account pubkey required in command
    .command('fetch-crux-by-key', 'Fetch crux PDA account info by pubkey', {
        cruxPubkey: {
            alias: 'k',
            type: 'string',
            demandOption: true,
            description: 'crux account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const cruxKey: PublicKey = new PublicKey(argv.cruxPubkey);

                 if (!argv.dryRun) {

                     const cruxPDA = await challengerClient.fetchCruxAccount(cruxKey);

                     console.log('Displaying account info for crux with pubkey: ', cruxKey.toBase58());
                     console.dir(stringifyPKsAndBNs(cruxPDA), {depth: null});

                 } else {
                     console.log('Found crux PDA for pubkey:', cruxKey.toBase58());
                 }
             })



// Fetch all user profile PDAs
    .command('fetch-all-profiles', 'Fetch all user profile PDA accounts info', {
        cruxPubkey: {
            alias: 'x',
            type: 'string',
            demandOption: false,
            description: 'crux account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 if (argv.cruxPubkey) {

                     const cruxKey: PublicKey = new PublicKey(argv.cruxPubkey);

                     if (!argv.dryRun) {

                         console.log('Fetching all profile PDAs for crux pubkey:', cruxKey.toBase58());
                         const profilePDAs = await challengerClient.fetchAllUserProfilePDAs(cruxKey);

                         // Loop over all PDAs and display account info
                         for (let num = 1; num <= profilePDAs.length; num++) {
                             console.log('User profile account', num, ':');
                             console.dir(stringifyPKsAndBNs(profilePDAs[num - 1]), {depth: null});
                         }

                     } else {
                         console.log('Found n user profile PDA accounts for crux pubkey:', cruxKey.toBase58());
                     }

                 } else {

                     if (!argv.dryRun) {

                         console.log('Fetching all profile PDAs');
                         const profilePDAs = await challengerClient.fetchAllUserProfilePDAs();

                         // Loop over all PDAs and display account info
                         for (let num = 1; num <= profilePDAs.length; num++) {
                             console.log('User profile account', num, ':');
                             console.dir(stringifyPKsAndBNs(profilePDAs[num - 1]), {depth: null});
                         }

                     } else {
                         console.log('Found n user profile PDA accounts');
                     }
                 }
             })



// Fetch user profile PDA by Owner Pubkey
// User profile account owner pubkey required in command
    .command('fetch-all-profiles-by-owner', 'Fetch user profile PDA account info by owner pubkey', {
        userProfileOwnerPubkey: {
            alias: 'o',
            type: 'string',
            demandOption: true,
            description: 'user profile account owner pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const profileOwnerKey: PublicKey = new PublicKey(argv.userProfileOwnerPubkey);

                 if (!argv.dryRun) {

                     const profilePDAs = await challengerClient.fetchAllUserProfilePDAsByProfileOwner(profileOwnerKey);

                     // Loop over all PDAs and display account info
                     for (let num = 1; num <= profilePDAs.length; num++) {
                         console.log('Displaying account info for user profile with owner pubkey: ', profileOwnerKey.toBase58());
                         console.dir(stringifyPKsAndBNs(profilePDAs[num - 1]), {depth: null});
                     }

                 } else {
                     console.log('Found user profile PDA for owner pubkey:', profileOwnerKey.toBase58());
                 }
             })



// Fetch user profile PDA by Pubkey
// User profile account pubkey required in command
    .command('fetch-profile-by-key', 'Fetch user profile PDA account info by pubkey', {
        userProfilePubkey: {
            alias: 'k',
            type: 'string',
            demandOption: true,
            description: 'user profile account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const profileKey: PublicKey = new PublicKey(argv.userProfilePubkey);

                 if (!argv.dryRun) {

                     const profilePDA = await challengerClient.fetchUserProfileAccount(profileKey);

                     console.log('Displaying account info for user profile with pubkey: ', profileKey.toBase58());
                     console.dir(stringifyPKsAndBNs(profilePDA), {depth: null});

                 } else {
                     console.log('Found user profile PDA for pubkey:', profileKey.toBase58());
                 }
             })



// Fetch all challenge PDAs
    .command('fetch-all-challenges', 'Fetch all challenge PDA accounts info', {
        cruxPubkey: {
            alias: 'x',
            type: 'string',
            demandOption: false,
            description: 'crux account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 if (argv.cruxPubkey) {

                     const cruxKey: PublicKey = new PublicKey(argv.cruxPubkey);

                     if (!argv.dryRun) {

                         console.log('Fetching all challenge PDAs for crux pubkey:', cruxKey.toBase58());
                         const challengePDAs = await challengerClient.fetchAllChallengePDAs(cruxKey);

                         // Loop over all PDAs and display account info
                         for (let num = 1; num <= challengePDAs.length; num++) {
                             console.log('Challenge account', num, ':');
                             console.dir(stringifyPKsAndBNs(challengePDAs[num - 1]), {depth: null});
                         }
                     } else {
                         console.log('Found n challenge PDA accounts for crux pubkey:', cruxKey.toBase58());
                     }
                 } else {
                     if (!argv.dryRun) {

                         console.log('Fetching all challenge PDAs');
                         const challengePDAs = await challengerClient.fetchAllChallengePDAs();

                         // Loop over all PDAs and display account info
                         for (let num = 1; num <= challengePDAs.length; num++) {
                             console.log('Challenge account', num, ':');
                             console.dir(stringifyPKsAndBNs(challengePDAs[num - 1]), {depth: null});
                         }
                     } else {
                         console.log('Found n challenge PDA accounts');
                     }
                 }
             })



// Fetch challenge PDA by Pubkey
// Challenge account pubkey required in command
    .command('fetch-challenge-by-key', 'Fetch challenge PDA account info by pubkey', {
        challengePubkey: {
            alias: 'k',
            type: 'string',
            demandOption: true,
            description: 'challenge account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const challengeKey: PublicKey = new PublicKey(argv.challengePubkey);

                 if (!argv.dryRun) {

                     const challengePDA = await challengerClient.fetchChallengeAccount(challengeKey);

                     console.log('Displaying account info for challenge with pubkey: ', challengeKey.toBase58());
                     console.dir(stringifyPKsAndBNs(challengePDA), {depth: null});

                 } else {
                     console.log('Found challenge PDA for pubkey:', challengeKey.toBase58());
                 }
             })



// Fetch all submission PDAs
    .command('fetch-all-submissions', 'Fetch all submission PDA accounts info', {
        challengePubkey: {
            alias: 'c',
            type: 'string',
            demandOption: false,
            description: 'challenge account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 if (argv.challengePubkey) {

                     const challengeKey: PublicKey = new PublicKey(argv.challengePubkey);

                     if (!argv.dryRun) {

                         console.log('Fetching all submission PDAs for challenge with pubkey:', challengeKey.toBase58());
                         const submissionPDAs = await challengerClient.fetchAllSubmissionPDAs(challengeKey);

                         // Loop over all PDAs and display account info
                         for (let num = 1; num <= submissionPDAs.length; num++) {
                             console.log('Submission account', num, ':');
                             console.dir(stringifyPKsAndBNs(submissionPDAs[num - 1]), {depth: null});
                         }

                     } else {
                         console.log('Found n submission PDA accounts for challenge with pubkey:', challengeKey.toBase58());
                     }
                 } else {

                     if (!argv.dryRun) {

                         console.log('Fetching all submission PDAs');
                         const submissionPDAs = await challengerClient.fetchAllSubmissionPDAs();

                         // Loop over all PDAs and display account info
                         for (let num = 1; num <= submissionPDAs.length; num++) {
                             console.log('Submission account', num, ':');
                             console.dir(stringifyPKsAndBNs(submissionPDAs[num - 1]), {depth: null});
                         }

                     } else {
                         console.log('Found n submission PDA accounts ');
                     }
                 }
             })



// Fetch all submission PDAs for a specific user profile account
    .command('fetch-all-submissions-by-profile', 'Fetch all submission PDA accounts info for a specific user profile', {
        userProfilePubkey: {
            alias: 'p',
            type: 'string',
            demandOption: true,
            description: 'user profile account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const userProfileKey: PublicKey = new PublicKey(argv.userProfilePubkey);

                 if (!argv.dryRun) {

                     console.log('Fetching all submission PDAs for user profile with pubkey: ', userProfileKey.toBase58());
                     const submissionPDAs = await challengerClient.fetchAllSubmissionPDAsByUserProfile(userProfileKey);

                     // Loop over all PDAs and display account info
                     for (let num = 1; num <= submissionPDAs.length; num++) {
                         console.log('Submission account', num, ':');
                         console.dir(stringifyPKsAndBNs(submissionPDAs[num - 1]), {depth: null});
                     }

                 } else {
                     console.log('Found n submission PDA accounts for user profile with pubkey: ', userProfileKey.toBase58());
                 }
             })



// Fetch submission PDA by Pubkey
// Submission account pubkey required in command
    .command('fetch-submission-by-key', 'Fetch submission PDA account info by pubkey', {
        submissionPubkey: {
            alias: 'k',
            type: 'string',
            demandOption: true,
            description: 'submission account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const submissionKey: PublicKey = new PublicKey(argv.submissionPubkey);

                 if (!argv.dryRun) {

                     const submissionPDA = await challengerClient.fetchSubmissionAccount(submissionKey);

                     console.log('Displaying account info for submission with pubkey: ', submissionKey.toBase58());
                     console.dir(stringifyPKsAndBNs(submissionPDA), {depth: null});

                 } else {
                     console.log('Found submission PDA for pubkey:', submissionKey.toBase58());
                 }
             })



// Fetch crux authority PDA
// Crux account pubkey required in command
    .command('fetch-crux-auth', 'Fetch crux authority PDA pubkey', {
        cruxPubkey: {
            alias: 'x',
            type: 'string',
            demandOption: true,
            description: 'crux account pubkey'
        }
    },
             async (argv) => {

                 const cruxKey: PublicKey = new PublicKey(argv.cruxPubkey);

                 if (!argv.dryRun) {

                     const [cruxAuthKey, _cruxAuthKeyBump] = await findCruxAuthorityPDA(cruxKey);

                     console.log('Crux authority key is: ', cruxAuthKey.toBase58());

                 } else {
                     console.log('Found crux authority key for crux account with pubkey: ', cruxKey.toBase58());
                 }
             })



// Fetch treasury balance
// Crux account pubkey required in command
    .command('fetch-treasury-balance', 'Fetch crux account treasury balance', {
        cruxPubkey: {
            alias: 'x',
            type: 'string',
            demandOption: true,
            description: 'crux account pubkey'
        },
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const challengerClient: ChallengerClient = new ChallengerClient(
                     rpcConn,
                     wallet,
                     ChallengerIDL,
                     CHALLENGER_PROG_ID,
                 );

                 const cruxKey: PublicKey = new PublicKey(argv.cruxPubkey);

                 if (!argv.dryRun) {

                     const treasuryBalance = await challengerClient.fetchTreasuryBalance(cruxKey);

                     console.log('Displaying treasury balance for crux account with pubkey: ', cruxKey.toBase58());
                     console.log(stringifyPKsAndBNs(treasuryBalance));

                 } else {
                     console.log('Found treasury balance for crux account with pubkey:', cruxKey.toBase58());
                 }
             })



// ------------------------------------------------ misc ----------------------------------------------------------
    .usage('Usage: $0 [-d] -c [config_file] <command> <options>')
    .help();



async function loadWallet(fileName: string): Promise<Keypair> {
    let walletBytes = JSON.parse((await fs.readFile(fileName)).toString());
    let privKeyBytes = walletBytes.slice(0,32);
    let keypair = Keypair.fromSeed(Uint8Array.from(privKeyBytes));
    return keypair
}



// Let's go!
(async() => {
    await parser.argv;
    process.exit();
})();
