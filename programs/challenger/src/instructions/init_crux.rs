use anchor_lang::prelude::*;

use crate::state::{Crux, CruxFees, LATEST_CRUX_VERSION};

#[derive(Accounts)]
#[instruction(bump_crux_auth: u8)]
pub struct InitCrux<'info> {

    // Crux and Crux Manager
    #[account(init, payer = crux_manager, space = 8 + std::mem::size_of::<Crux>())]
    pub crux: Box<Account<'info, Crux>>,

    #[account(mut)]
    pub crux_manager: Signer<'info>,

    /// CHECK:
    #[account(seeds = [crux.key().as_ref()], bump = bump_crux_auth)]
    pub crux_authority: AccountInfo<'info>,

    /// CHECK:
    #[account(init, seeds = [b"treasury".as_ref(), crux.key().as_ref()], bump, payer = crux_manager, space = 8)]
    pub crux_treasury: AccountInfo<'info>,

    // misc
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitCrux>, crux_fees: CruxFees) -> Result<()> {

    let crux = &mut ctx.accounts.crux;

    // Manually derive the pubkey of the crux authority PDA responsible for all token transfers in/out of the new crux account
    let (crux_authority_key, bump_crux_auth) = Pubkey::find_program_address(&[crux.key().as_ref()], ctx.program_id);
    // Check that the derived authority PDA pubkey matches the one provided
    assert_eq!(ctx.accounts.crux_authority.key(), crux_authority_key);

    // Manually derive the pubkey of the crux treasury PDA
    let (crux_treasury_key, _bump_crux_treasury) = Pubkey::find_program_address(&[b"treasury".as_ref(), crux.key().as_ref()], ctx.program_id);
    // Check that the derived treasury PDA pubkey matches the one provided
    assert_eq!(ctx.accounts.crux_treasury.key(), crux_treasury_key);

    // Record Crux's State
    crux.version = LATEST_CRUX_VERSION;
    crux.crux_manager = ctx.accounts.crux_manager.key();

    crux.crux_authority = ctx.accounts.crux_authority.key();
    crux.crux_authority_seed = crux.key();
    crux.crux_authority_bump_seed = [bump_crux_auth];

    crux.crux_treasury = ctx.accounts.crux_treasury.key();
    crux.crux_fees = crux_fees;

    crux.crux_counts.profile_count = 0;
    crux.crux_counts.challenge_count = 0;
    crux.crux_counts.submission_count = 0;

    msg!("New crux account with pubkey {} initialized", ctx.accounts.crux.key());
    Ok(())
}
