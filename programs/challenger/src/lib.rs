use anchor_lang::prelude::*;
use instructions::*;
use crate::state::{CruxFees, SubmissionState, Tags};

declare_id!("CRuXQ86F4m6VfRHa7VACNbQKJoSioG3gcpui9BH2YNWa");

pub mod instructions;
pub mod state;

#[program]
pub mod challenger{
    use super::*;

    // Anchor is retarded and wants variables passed in, in a certain order
    // It must be ctx, bump_seeds, parameters

    pub fn init_crux(
        ctx: Context<InitCrux>,
        _bump_crux_auth: u8,
        crux_fees: CruxFees,
    ) -> Result<()> {
        msg!("initializing crux");
        instructions::init_crux::handler(
            ctx,
            crux_fees
        )
    }

    pub fn update_crux_params(
        ctx: Context<UpdateCruxParams>,
        new_crux_fees: CruxFees,
    ) -> Result<()> {
        msg!("updating crux fees");
        instructions::update_crux_params::handler(
            ctx,
            new_crux_fees
        )
    }

    pub fn payout_from_treasury(
        ctx: Context<PayoutFromTreasury>,
        _bump_treasury: u8,
    ) -> Result<()> {
        msg!("paying out funds from treasury");
        instructions::payout_from_treasury::handler(ctx)
    }

    pub fn close_crux(
        ctx: Context<CloseCrux>,
        _bump_treasury: u8,
    ) -> Result<()> {
        msg!("closing crux");
        instructions::close_crux::handler(ctx)
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    pub fn create_user_profile(
        ctx: Context<CreateUserProfile>,
        _bump_treasury: u8,
    ) -> Result<()> {
        msg!("creating user profile");
        instructions::create_user_profile::handler(ctx)
    }

    pub fn edit_user_profile(
        ctx: Context<EditUserProfile>,
        _bump_user_profile: u8,
    ) -> Result<()> {
        msg!("editing user profile");
        instructions::edit_user_profile::handler(ctx)
    }

    pub fn delete_user_profile(
        ctx: Context<DeleteUserProfile>,
        _bump_user_profile: u8,
    ) -> Result<()> {
        msg!("deleting user profile");
        instructions::delete_user_profile::handler(ctx)
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    pub fn add_moderator(
        ctx: Context<AddModerator>,
        _bump_user_profile: u8,
    ) -> Result<()> {
        msg!("adding moderator");
        instructions::add_moderator::handler(ctx)
    }

    pub fn remove_moderator(
        ctx: Context<RemoveModerator>,
        _bump_user_profile: u8,
    ) -> Result<()> {
        msg!("removing moderator");
        instructions::remove_moderator::handler(ctx)
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        _bump_moderator_profile: u8,
        tags: Vec<Tags>,
        title: String,
        content_data_url: String,
        challenge_expires_ts: u64,
        reputation: u64,
    ) -> Result<()> {
        msg!("creating challenge");
        instructions::create_challenge::handler(
            ctx,
            tags,
            title,
            content_data_url,
            challenge_expires_ts,
            reputation
        )
    }

    pub fn edit_challenge(
        ctx: Context<EditChallenge>,
        _bump_moderator_profile: u8,
        _bump_challenge: u8,
        new_tags: Vec<Tags>,
        new_title: String,
        new_content_data_url: String,
        new_challenge_expires_ts: u64,
        new_reputation: u64,
    ) -> Result<()> {
        msg!("editing challenge");
        instructions::edit_challenge::handler(
            ctx,
            new_tags,
            new_title,
            new_content_data_url,
            new_challenge_expires_ts,
            new_reputation
        )
    }

    pub fn delete_challenge(
        ctx: Context<DeleteChallenge>,
        _bump_moderator_profile: u8,
        _bump_challenge: u8,
    ) -> Result<()> {
        msg!("deleting challenge");
        instructions::delete_challenge::handler(ctx)
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    pub fn create_submission(
        ctx: Context<CreateSubmission>,
        _bump_treasury: u8,
        _bump_user_profile: u8,
        _bump_challenge: u8,
    ) -> Result<()> {
        msg!("creating submission");
        instructions::create_submission::handler(ctx)
    }

    pub fn edit_submission(
        ctx: Context<EditSubmission>,
        _bump_user_profile: u8,
        _bump_challenge: u8,
        _bump_submission: u8,
    ) -> Result<()> {
        msg!("editing submission");
        instructions::edit_submission::handler(ctx)
    }

    pub fn delete_submission(
        ctx: Context<DeleteSubmission>,
        _bump_user_profile: u8,
        _bump_challenge: u8,
        _bump_submission: u8,
    ) -> Result<()> {
        msg!("deleting submission");
        instructions::delete_submission::handler(ctx)
    }

    pub fn delete_submission_moderator(
        ctx: Context<DeleteSubmissionModerator>,
        _bump_user_profile: u8,
        _bump_challenge: u8,
        _bump_submission: u8,
    ) -> Result<()> {
        msg!("deleting submission");
        instructions::delete_submission_moderator::handler(ctx)
    }

    pub fn evaluate_submission(
        ctx: Context<EvaluateSubmission>,
        _bump_moderator_profile: u8,
        _bump_user_profile: u8,
        _bump_challenge: u8,
        _bump_submission: u8,
        submission_state: SubmissionState,
    ) -> Result<()> {
        msg!("evaluating submission");
        instructions::evaluate_submission::handler(
            ctx,
            submission_state
        )
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    pub fn close_account(
        ctx: Context<CloseAccount>,
    ) -> Result<()> {
        msg!("closing account");
        instructions::close_account::handler(ctx)
    }
}
