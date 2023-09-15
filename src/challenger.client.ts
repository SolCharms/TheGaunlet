import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider, BN, Idl, IdlTypes, Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Challenger } from './challenger.types';
import {
    findCruxAuthorityPDA,
    findCruxTreasuryPDA,
    findUserProfilePDA,
    findChallengePDA,
    findSubmissionPDA
} from './challenger.pda';

// Enum: Tags
export const tagValues = {
    Client: {client: {}},
    Concept: {concept: {}},
    Deploy: {deploy: {}},
    Gaming: {gaming: {}},
    Nfts: {nfts: {}},
    Sdk: {sdk: {}},
    Social: {social: {}},
    Staking: {staking: {}},
    Video: {video: {}},
    Wallets: {wallets: {}},
}

// Enum: SubmissionState
export const submissionState = {
    Completed: {completed: {}},
    Rejected: {rejected: {}},
    Pending: {pending: {}},
}

export type Tags = IdlTypes<Challenger>['Tags'];

export type SubmissionState = IdlTypes<Challenger>['SubmissionState'];

export interface CruxCounts {
    profileCount: BN;
    challengeCount: BN;
    submissionCount: BN;
}

export interface CruxFees {
    profileFee: BN;
    submissionFee: BN;
}

function isKp(toCheck: PublicKey | Keypair) {
    return typeof (<Keypair>toCheck).publicKey !== 'undefined';
}

export class ChallengerClient {
    connection: Connection;
    wallet: anchor.Wallet;
    provider!: anchor.Provider;
    challengerProgram!: anchor.Program<Challenger>;

    constructor(
        connection: Connection,
        wallet: anchor.Wallet,
        idl?: Idl,
        programId?: PublicKey
    ) {
        this.connection = connection;
        this.wallet = wallet;
        this.setProvider();
        this.setChallengerProgram(idl, programId);
    }

    setProvider() {
        this.provider = new AnchorProvider(
            this.connection,
            this.wallet,
            AnchorProvider.defaultOptions()
        );
        anchor.setProvider(this.provider);
    }

    setChallengerProgram(idl?: Idl, programId?: PublicKey) {
        //instantiating program depends on the environment
        if (idl && programId) {
            //means running in prod
            this.challengerProgram = new anchor.Program<Challenger>(
                idl as any,
                programId,
                this.provider
            );
        } else {
            //means running inside test suite
            this.challengerProgram = anchor.workspace.BountyPool as Program<Challenger>;
        }
    }

    // -------------------------------------------------------- fetch deserialized accounts

    async fetchCruxAccount(crux: PublicKey) {
        return this.challengerProgram.account.crux.fetch(crux);
    }

    async fetchUserProfileAccount(userProfile: PublicKey) {
        return this.challengerProgram.account.userProfile.fetch(userProfile);
    }

    async fetchChallengeAccount(challenge: PublicKey) {
        return this.challengerProgram.account.challenge.fetch(challenge);
    }

    async fetchSubmissionAccount(submission: PublicKey) {
        return this.challengerProgram.account.submission.fetch(submission);
    }

    async fetchTreasuryBalance(crux: PublicKey) {
        const [treasury] = await findCruxTreasuryPDA(crux);
        return this.connection.getBalance(treasury);
    }

    // -------------------------------------------------------- get all PDAs by type

    async fetchAllCruxPDAs(cruxManager?: PublicKey) {
        const filter = cruxManager
            ? [
                {
                    memcmp: {
                        offset: 10, // need to prepend 8 bytes for anchor's disc and 2 for version: u16
                        bytes: cruxManager.toBase58(),
                    },
                },
            ]
            : [];
        const pdas = await this.challengerProgram.account.crux.all(filter);
        if (cruxManager) {
            console.log('Found a total of', pdas.length, 'crux PDAs for crux manager with address', cruxManager.toBase58());
        }
        else {
            console.log('Found a total of', pdas.length, 'crux PDAs');
        }
        return pdas;
    }

    async fetchAllUserProfilePDAs(crux?: PublicKey) {
        const filter = crux
            ? [
                {
                    memcmp: {
                        offset: 40, // need to prepend 8 bytes for anchor's disc and 32 for profile owner pubkey
                        bytes: crux.toBase58(),
                    },
                },
            ]
            : [];
        const pdas = await this.challengerProgram.account.userProfile.all(filter);
        if (crux) {
            console.log('Found a total of', pdas.length, 'user profile PDAs for crux with address', crux.toBase58());
        }
        else {
            console.log('Found a total of', pdas.length, 'user profile PDAs');
        }
        return pdas;
    }

    async fetchAllUserProfilePDAsByProfileOwner(profileOwner: PublicKey) {
        const filter = profileOwner
            ? [
                {
                    memcmp: {
                        offset: 8, // need to prepend 8 bytes for anchor's disc
                        bytes: profileOwner.toBase58(),
                    },
                },
            ]
            : [];
        const pdas = await this.challengerProgram.account.userProfile.all(filter);
        console.log('Found a total of', pdas.length, 'user profile PDAs for profile owner with address', profileOwner.toBase58());
        return pdas;
    }

    async fetchAllChallengePDAs(crux?: PublicKey) {
        const filter = crux
            ? [
                {
                    memcmp: {
                        offset: 8, // need to prepend 8 bytes for anchor's disc
                        bytes: crux.toBase58(),
                    },
                },
            ]
            : [];
        const pdas = await this.challengerProgram.account.challenge.all(filter);
        if (crux) {
            console.log('Found a total of', pdas.length, 'challenge PDAs for crux with address', crux.toBase58());
        }
        else {
            console.log('Found a total of', pdas.length, 'challenge PDAs');
        }
        return pdas;
    }

    async fetchAllSubmissionPDAs(challenge?: PublicKey) {
        const filter = challenge
            ? [
                {
                    memcmp: {
                        offset: 8, // need to prepend 8 bytes for anchor's disc
                        bytes: challenge.toBase58(),
                    },
                },
            ]
            : [];
        const pdas = await this.challengerProgram.account.submission.all(filter);
        if (challenge) {
            console.log('Found a total of', pdas.length, 'submission PDAs for challenge account with address', challenge.toBase58());
        }
        else {
            console.log('Found a total of', pdas.length, 'submission PDAs');
        }
        return pdas;
    }

    async fetchAllSubmissionPDAsByUserProfile(userProfile: PublicKey) {
        const filter = userProfile
            ? [
                {
                    memcmp: {
                        offset: 40, // need to prepend 8 bytes for anchor's disc and 32 for forum pubkey
                        bytes: userProfile.toBase58(),
                    },
                },
            ]
            : [];
        const pdas = await this.challengerProgram.account.submission.all(filter);
        console.log('Found a total of', pdas.length, 'submission PDAs for user profile with address', userProfile.toBase58());
        return pdas;
    }

    // -------------------------------------------------------- execute ixs

    async initCrux(
        crux: Keypair,
        cruxManager: PublicKey | Keypair,
        cruxFees: CruxFees,
    ) {
        // Derive PDAs
        const [cruxAuthority, cruxAuthBump] = await findCruxAuthorityPDA(crux.publicKey);
        const [cruxTreasury, cruxTreasuryBump] = await findCruxTreasuryPDA(crux.publicKey);

        // Create Signers Array
        const signers = [crux];
        if (isKp(cruxManager)) signers.push(<Keypair>cruxManager);

        console.log('initializing crux account with pubkey: ', crux.publicKey.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .initCrux(
                cruxAuthBump,
                cruxFees,
            )
            .accounts({
                crux: crux.publicKey,
                cruxManager: isKp(cruxManager)? (<Keypair>cruxManager).publicKey : <PublicKey>cruxManager,
                cruxAuthority: cruxAuthority,
                cruxTreasury: cruxTreasury,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Crux account with address ${crux.publicKey} initialized`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            cruxAuthority,
            cruxAuthBump,
            cruxTreasury,
            cruxTreasuryBump,
            txSigMessage,
            txSig
        }
    }

    async updateCruxParams(
        crux: PublicKey,
        cruxManager: PublicKey | Keypair,
        cruxFees: CruxFees,
    ) {
        // Create Signers Array
        const signers = [];
        if (isKp(cruxManager)) signers.push(<Keypair>cruxManager);

        console.log('updating crux parameters for crux account with pubkey: ', crux.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .updateCruxParams(
                cruxFees,
            )
            .accounts({
                crux: crux,
                cruxManager: isKp(cruxManager)? (<Keypair>cruxManager).publicKey : <PublicKey>cruxManager,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Parameters for crux account with address ${crux} updated`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            txSigMessage,
            txSig
        }
    }

    async payoutFromTreasury(
        crux: PublicKey,
        cruxManager: PublicKey | Keypair,
        receiver: PublicKey,
    ) {
        // Derive PDAs
        const [cruxTreasury, cruxTreasuryBump] = await findCruxTreasuryPDA(crux);

        // Create Signers Array
        const signers = [];
        if (isKp(cruxManager)) signers.push(<Keypair>cruxManager);

        console.log('paying out from treasury for crux account with pubkey: ', crux.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .payoutFromTreasury(
                cruxTreasuryBump,
            )
            .accounts({
                crux: crux,
                cruxManager: isKp(cruxManager)? (<Keypair>cruxManager).publicKey : <PublicKey>cruxManager,
                cruxTreasury: cruxTreasury,
                receiver: receiver,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Funds from crux account with address ${crux} collected`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            cruxTreasury,
            cruxTreasuryBump,
            txSigMessage,
            txSig
        }
    }

    async closeCrux(
        crux: PublicKey,
        cruxManager: PublicKey | Keypair,
        receiver: PublicKey,
    ) {
        // Derive PDAs
        const [cruxTreasury, cruxTreasuryBump] = await findCruxTreasuryPDA(crux);

        // Create Signers Array
        const signers = [];
        if (isKp(cruxManager)) signers.push(<Keypair>cruxManager);

        console.log('closing crux account with pubkey: ', crux.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .closeCrux(
                cruxTreasuryBump,
            )
            .accounts({
                crux: crux,
                cruxManager: isKp(cruxManager)? (<Keypair>cruxManager).publicKey : <PublicKey>cruxManager,
                cruxTreasury: cruxTreasury,
                receiver: receiver,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Crux account with address ${crux} closed`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            cruxTreasury,
            cruxTreasuryBump,
            txSigMessage,
            txSig
        }
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async createUserProfile(
        crux: PublicKey,
        profileOwner: PublicKey | Keypair
    ) {
        const profileOwnerKey = isKp(profileOwner) ? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner;

        // Derive PDAs
        const [cruxTreasury, cruxTreasuryBump] = await findCruxTreasuryPDA(crux);
        const [userProfile, userProfileBump] = await findUserProfilePDA(crux, profileOwnerKey);

        // Create Signers Array
        const signers = [];
        if (isKp(profileOwner)) signers.push(<Keypair>profileOwner);

        console.log('creating user profile account with pubkey: ', userProfile.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .createUserProfile(
                cruxTreasuryBump,
            )
            .accounts({
                crux: crux,
                cruxTreasury: cruxTreasury,
                profileOwner: isKp(profileOwner)? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner,
                userProfile: userProfile,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `User profile account with address ${userProfile} created`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            cruxTreasury,
            cruxTreasuryBump,
            userProfile,
            userProfileBump,
            txSigMessage,
            txSig
        }
    }

    async editUserProfile(
        crux: PublicKey,
        profileOwner: PublicKey | Keypair,
        nft_token_mint: PublicKey,
    ) {
        const profileOwnerKey = isKp(profileOwner) ? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner;

        // Derive PDAs
        const [userProfile, userProfileBump] = await findUserProfilePDA(crux, profileOwnerKey);

        // Create Signers Array
        const signers = [];
        if (isKp(profileOwner)) signers.push(<Keypair>profileOwner);

        console.log('editing user profile account with pubkey: ', userProfile.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .editUserProfile(
                userProfileBump
            )
            .accounts({
                crux: crux,
                profileOwner: isKp(profileOwner)? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner,
                userProfile: userProfile,
                nftPfpTokenMint: nft_token_mint,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `User profile account with address ${userProfile} edited`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            userProfile,
            userProfileBump,
            txSigMessage,
            txSig
        }
    }

    async deleteUserProfile(
        crux: PublicKey,
        profileOwner: PublicKey | Keypair,
        receiver: PublicKey,
    ) {
        const profileOwnerKey = isKp(profileOwner) ? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner;

        // Derive PDAs
        const [userProfile, userProfileBump] = await findUserProfilePDA(crux, profileOwnerKey);

        // Create Signers Array
        const signers = [];
        if (isKp(profileOwner)) signers.push(<Keypair>profileOwner);

        console.log('deleting user profile account with pubkey: ', userProfile.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .deleteUserProfile(
                userProfileBump
            )
            .accounts({
                crux: crux,
                profileOwner: isKp(profileOwner)? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner,
                userProfile: userProfile,
                receiver: receiver,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `User profile account with address ${userProfile} deleted`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            userProfile,
            userProfileBump,
            txSigMessage,
            txSig
        }
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async addModerator(
        userProfile: PublicKey,
        cruxManager: PublicKey | Keypair,
    ) {
        const userProfileAcct = await this.fetchUserProfileAccount(userProfile);
        const crux = userProfileAcct.crux;
        const profileOwner = userProfileAcct.profileOwner;

        // Derive PDAs
        const [userProfileKey, userProfileBump] = await findUserProfilePDA(crux, profileOwner);

        // Create Signers Array
        const signers = [];
        if (isKp(cruxManager)) signers.push(<Keypair>cruxManager);

        console.log('adding moderator status to user profile account with pubkey: ', userProfile.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .addModerator(
                userProfileBump,
            )
            .accounts({
                crux: crux,
                cruxManager: isKp(cruxManager)? (<Keypair>cruxManager).publicKey : <PublicKey>cruxManager,
                profileOwner: profileOwner,
                userProfile: userProfile,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `User profile account with address ${userProfile} is now moderator`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            userProfileKey,
            userProfileBump,
            txSigMessage,
            txSig
        }
    }

    async removeModerator(
        userProfile: PublicKey,
        cruxManager: PublicKey | Keypair,
    ) {
        const userProfileAcct = await this.fetchUserProfileAccount(userProfile);
        const crux = userProfileAcct.crux;
        const profileOwner = userProfileAcct.profileOwner;

        // Derive PDAs
        const [userProfileKey, userProfileBump] = await findUserProfilePDA(crux, profileOwner);

        // Create Signers Array
        const signers = [];
        if (isKp(cruxManager)) signers.push(<Keypair>cruxManager);

        console.log('removing moderator status from user profile account with pubkey: ', userProfile.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .removeModerator(
                userProfileBump,
            )
            .accounts({
                crux: crux,
                cruxManager: isKp(cruxManager)? (<Keypair>cruxManager).publicKey : <PublicKey>cruxManager,
                profileOwner: profileOwner,
                userProfile: userProfile,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `User profile account with address ${userProfile} is no longer moderator`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            userProfileKey,
            userProfileBump,
            txSigMessage,
            txSig
        }
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async createChallenge(
        crux: PublicKey,
        moderator: PublicKey | Keypair,
        contentDataHash: PublicKey,
        title: string,
        contentDataUrl: string,
        tags: Tags[],
        challengeExpiresTs: BN,
        reputation: BN,
    ) {
        const challengeSeedKeypair = Keypair.generate();
        const challengeSeed: PublicKey = challengeSeedKeypair.publicKey;

        const moderatorKey = isKp(moderator) ? (<Keypair>moderator).publicKey : <PublicKey>moderator;

        // Derive PDAs
        const [moderatorProfile, moderatorProfileBump] = await findUserProfilePDA(crux, moderatorKey);
        const [challenge, challengeBump] = await findChallengePDA(crux, challengeSeed);

        // Create Signers Array
        const signers = [];
        if (isKp(moderator)) signers.push(<Keypair>moderator);

        console.log('creating challenge with pubkey: ', challenge.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .createChallenge(
                moderatorProfileBump,
                tags,
                title,
                contentDataUrl,
                challengeExpiresTs,
                reputation,
            )
            .accounts({
                crux: crux,
                moderator: isKp(moderator)? (<Keypair>moderator).publicKey : <PublicKey>moderator,
                moderatorProfile: moderatorProfile,
                challenge: challenge,
                challengeSeed: challengeSeed,
                contentDataHash: contentDataHash,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Challenge account with address ${challenge} created`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            moderatorProfile,
            moderatorProfileBump,
            challenge,
            challengeBump,
            challengeSeed,
            txSigMessage,
            txSig
        }
    }

    async editChallenge(
        challengeKey: PublicKey,
        moderator: PublicKey | Keypair,
        newContentDataHash: PublicKey,
        newTitle: string,
        newContentDataUrl: string,
        newTags: Tags[],
        newChallengeExpiresTs: BN,
        newReputation: BN,
    ) {
        const challengeAcct = await this.fetchChallengeAccount(challengeKey);
        const cruxKey = challengeAcct.crux;
        const challengeSeedKey = challengeAcct.challengeSeed;

        const moderatorKey = isKp(moderator) ? (<Keypair>moderator).publicKey : <PublicKey>moderator;

        // Derive PDAs
        const [moderatorProfile, moderatorProfileBump] = await findUserProfilePDA(cruxKey, moderatorKey);
        const [challenge, challengeBump] = await findChallengePDA(cruxKey, challengeSeedKey);

        // Create Signers Array
        const signers = [];
        if (isKp(moderator)) signers.push(<Keypair>moderator);

        console.log('editing challenge with pubkey: ', challenge.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .editChallenge(
                moderatorProfileBump,
                challengeBump,
                newTags,
                newTitle,
                newContentDataUrl,
                newChallengeExpiresTs,
                newReputation,
            )
            .accounts({
                crux: cruxKey,
                moderator: isKp(moderator)? (<Keypair>moderator).publicKey : <PublicKey>moderator,
                moderatorProfile: moderatorProfile,
                challenge: challenge,
                challengeSeed: challengeSeedKey,
                newContentDataHash: newContentDataHash,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Challenge account with address ${challenge} edited`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            moderatorProfile,
            moderatorProfileBump,
            challenge,
            challengeBump,
            txSigMessage,
            txSig
        }
    }

    async deleteChallenge(
        challengeKey: PublicKey,
        moderator: PublicKey | Keypair,
        receiver: PublicKey,
    ) {
        const challengeAcct = await this.fetchChallengeAccount(challengeKey);
        const cruxKey = challengeAcct.crux;
        const challengeSeedKey = challengeAcct.challengeSeed;

        const moderatorKey = isKp(moderator) ? (<Keypair>moderator).publicKey : <PublicKey>moderator;

        // Derive PDAs
        const [moderatorProfile, moderatorProfileBump] = await findUserProfilePDA(cruxKey, moderatorKey);
        const [challenge, challengeBump] = await findChallengePDA(cruxKey, challengeSeedKey);

        // Create Signers Array
        const signers = [];
        if (isKp(moderator)) signers.push(<Keypair>moderator);

        console.log('deleting challenge with pubkey: ', challenge.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .deleteChallenge(
                moderatorProfileBump,
                challengeBump
            )
            .accounts({
                crux: cruxKey,
                moderator: isKp(moderator)? (<Keypair>moderator).publicKey : <PublicKey>moderator,
                moderatorProfile: moderatorProfile,
                challenge: challenge,
                challengeSeed: challengeSeedKey,
                receiver: receiver,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Challenge account with address ${challenge} deleted`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            moderatorProfile,
            moderatorProfileBump,
            challenge,
            challengeBump,
            txSigMessage,
            txSig
        }
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async createSubmission(
        challengeKey: PublicKey,
        profileOwner: PublicKey | Keypair,
        contentDataHash: PublicKey,
    ) {
        const challengeAcct = await this.fetchChallengeAccount(challengeKey);
        const cruxKey = challengeAcct.crux;
        const challengeSeedKey = challengeAcct.challengeSeed;

        const profileOwnerKey = isKp(profileOwner) ? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner;

        // Derive PDAs
        const [cruxTreasury, cruxTreasuryBump] = await findCruxTreasuryPDA(cruxKey);
        const [userProfile, userProfileBump] = await findUserProfilePDA(cruxKey, profileOwnerKey);
        const [challenge, challengeBump] = await findChallengePDA(cruxKey, challengeSeedKey);
        const [submission, submissionBump] = await findSubmissionPDA(challenge, userProfile);

        // Create Signers Array
        const signers = [];
        if (isKp(profileOwner)) signers.push(<Keypair>profileOwner);

        console.log('creating submission with pubkey: ', submission.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .createSubmission(
                cruxTreasuryBump,
                userProfileBump,
                challengeBump
            )
            .accounts({
                crux: cruxKey,
                cruxTreasury: cruxTreasury,
                profileOwner: isKp(profileOwner)? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner,
                userProfile: userProfile,
                challenge: challenge,
                challengeSeed: challengeSeedKey,
                submission: submission,
                contentDataHash: contentDataHash,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Submission account with address ${submission} created`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            cruxTreasury,
            cruxTreasuryBump,
            userProfile,
            userProfileBump,
            challenge,
            challengeBump,
            submission,
            submissionBump,
            txSigMessage,
            txSig
        }
    }

    async editSubmission(
        submissionKey: PublicKey,
        profileOwner: PublicKey | Keypair,
        newContentDataHash: PublicKey,
    ) {
        const submisionAcct = await this.fetchSubmissionAccount(submissionKey);
        const challengeKey = submisionAcct.challenge;

        const challengeAcct = await this.fetchChallengeAccount(challengeKey);
        const cruxKey = challengeAcct.crux;
        const challengeSeedKey = challengeAcct.challengeSeed;

        const profileOwnerKey = isKp(profileOwner) ? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner;

        // Derive PDAs
        const [userProfile, userProfileBump] = await findUserProfilePDA(cruxKey, profileOwnerKey);
        const [challenge, challengeBump] = await findChallengePDA(cruxKey, challengeSeedKey);
        const [submission, submissionBump] = await findSubmissionPDA(challenge, userProfile);

        // Create Signers Array
        const signers = [];
        if (isKp(profileOwner)) signers.push(<Keypair>profileOwner);

        console.log('editing submission with pubkey: ', submission.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .editSubmission(
                userProfileBump,
                challengeBump,
                submissionBump
            )
            .accounts({
                crux: cruxKey,
                profileOwner: isKp(profileOwner)? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner,
                userProfile: userProfile,
                challenge: challenge,
                challengeSeed: challengeSeedKey,
                submission: submission,
                newContentDataHash: newContentDataHash,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Submission account with address ${submission} edited`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            userProfile,
            userProfileBump,
            challenge,
            challengeBump,
            submission,
            submissionBump,
            txSigMessage,
            txSig
        }
    }

    async deleteSubmission(
        submissionKey: PublicKey,
        profileOwner: PublicKey | Keypair,
        receiver: PublicKey,
    ) {
        const submisionAcct = await this.fetchSubmissionAccount(submissionKey);
        const challengeKey = submisionAcct.challenge;

        const challengeAcct = await this.fetchChallengeAccount(challengeKey);
        const cruxKey = challengeAcct.crux;
        const challengeSeedKey = challengeAcct.challengeSeed;

        const profileOwnerKey = isKp(profileOwner) ? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner;

        // Derive PDAs
        const [userProfile, userProfileBump] = await findUserProfilePDA(cruxKey, profileOwnerKey);
        const [challenge, challengeBump] = await findChallengePDA(cruxKey, challengeSeedKey);
        const [submission, submissionBump] = await findSubmissionPDA(challenge, userProfile);

        // Create Signers Array
        const signers = [];
        if (isKp(profileOwner)) signers.push(<Keypair>profileOwner);

        console.log('deleting submission with pubkey: ', submission.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .deleteSubmission(
                userProfileBump,
                challengeBump,
                submissionBump,
            )
            .accounts({
                crux: cruxKey,
                profileOwner: isKp(profileOwner)? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner,
                userProfile: userProfile,
                challenge: challenge,
                challengeSeed: challengeSeedKey,
                submission: submission,
                receiver: receiver,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Submission account with address ${submission} deleted`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            userProfile,
            userProfileBump,
            challenge,
            challengeBump,
            submission,
            submissionBump,
            txSigMessage,
            txSig
        }
    }

    async deleteSubmissionModerator(
        submissionKey: PublicKey,
        moderator: PublicKey | Keypair,
        receiver: PublicKey,
    ) {
        const submissionAcct = await this.fetchSubmissionAccount(submissionKey);
        const challengeKey = submissionAcct.challenge;
        const userProfileKey = submissionAcct.userProfile;

        const challengeAcct = await this.fetchChallengeAccount(challengeKey);
        const cruxKey = challengeAcct.crux;
        const challengeSeedKey = challengeAcct.challengeSeed;

        const userProfileAcct = await this.fetchUserProfileAccount(userProfileKey);
        const profileOwner = userProfileAcct.profileOwner;

        const moderatorKey = isKp(moderator) ? (<Keypair>moderator).publicKey : <PublicKey>moderator;

        // Derive PDAs
        const [moderatorProfile, moderatorProfileBump] = await findUserProfilePDA(cruxKey, moderatorKey);
        const [userProfile, userProfileBump] = await findUserProfilePDA(cruxKey, profileOwner);
        const [challenge, challengeBump] = await findChallengePDA(cruxKey, challengeSeedKey);
        const [submission, submissionBump] = await findSubmissionPDA(challenge, userProfile);

        // Create Signers Array
        const signers = [];
        if (isKp(moderator)) signers.push(<Keypair>moderator);

        console.log('moderator deleting submission with pubkey: ', submission.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .deleteSubmissionModerator(
                moderatorProfileBump,
                userProfileBump,
                challengeBump,
                submissionBump,
            )
            .accounts({
                crux: cruxKey,
                moderator: isKp(moderator)? (<Keypair>moderator).publicKey : <PublicKey>moderator,
                moderatorProfile: moderatorProfile,
                profileOwner: profileOwner,
                userProfile: userProfile,
                challenge: challenge,
                challengeSeed: challengeSeedKey,
                submission: submission,
                receiver: receiver,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Submission account with address ${submission} deleted by moderator`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            userProfile,
            userProfileBump,
            challenge,
            challengeBump,
            submission,
            submissionBump,
            txSigMessage,
            txSig
        }
    }

    async evaluateSubmission(
        submissionKey: PublicKey,
        moderator: PublicKey | Keypair,
        submissionState: SubmissionState,
    ) {
        const submissionAcct = await this.fetchSubmissionAccount(submissionKey);
        const challengeKey = submissionAcct.challenge;
        const userProfileKey = submissionAcct.userProfile;

        const challengeAcct = await this.fetchChallengeAccount(challengeKey);
        const cruxKey = challengeAcct.crux;
        const challengeSeedKey = challengeAcct.challengeSeed;

        const userProfileAcct = await this.fetchUserProfileAccount(userProfileKey);
        const profileOwnerKey = userProfileAcct.profileOwner;

        const moderatorKey = isKp(moderator) ? (<Keypair>moderator).publicKey : <PublicKey>moderator;

        // Derive PDAs
        const [moderatorProfile, moderatorProfileBump] = await findUserProfilePDA(cruxKey, moderatorKey);
        const [userProfile, userProfileBump] = await findUserProfilePDA(cruxKey, profileOwnerKey);
        const [challenge, challengeBump] = await findChallengePDA(cruxKey, challengeSeedKey);
        const [submission, submissionBump] = await findSubmissionPDA(challenge, userProfile);

        // Create Signers Array
        const signers = [];
        if (isKp(moderator)) signers.push(<Keypair>moderator);

        console.log('accepting submission with pubkey: ', submission.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .evaluateSubmission(
                moderatorProfileBump,
                userProfileBump,
                challengeBump,
                submissionBump,
                submissionState,
            )
            .accounts({
                crux: cruxKey,
                moderator: isKp(moderator)? (<Keypair>moderator).publicKey : <PublicKey>moderator,
                moderatorProfile: moderatorProfile,
                profileOwner: profileOwnerKey,
                userProfile: userProfile,
                challenge: challenge,
                challengeSeed: challengeSeedKey,
                submission: submission,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        if (txSig) {
            var txSigMessage = `Submission account with address ${submission} evaluated with submission state ${submissionState}`;
        }
        else {
            var txSigMessage = 'Transaction failed';
        }

        return {
            moderatorProfile,
            moderatorProfileBump,
            userProfile,
            userProfileBump,
            challenge,
            challengeBump,
            submission,
            submissionBump,
            txSigMessage,
            txSig
        }
    }

    async closeAccount(
        signer: PublicKey | Keypair,
        accountToClose: PublicKey,
    ) {
        // Create Signers Array
        const signers = [];
        if (isKp(signer)) signers.push(<Keypair>signer);

        console.log('closing account with pubkey: ', accountToClose.toBase58());

        // Transaction
        const txSig = await this.challengerProgram.methods
            .closeAccount()
            .accounts({
                signer: isKp(signer) ? (<Keypair>signer).publicKey : <PublicKey>signer,
                accountToClose: accountToClose,
                systemProgram: SystemProgram.programId
            })
            .signers(signers)
            .rpc();

        return {
            txSig
        }
    }
}
