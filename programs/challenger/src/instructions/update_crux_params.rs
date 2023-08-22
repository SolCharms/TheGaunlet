use anchor_lang::prelude::*;

use crate::state::{Crux, CruxFees};

#[derive(Accounts)]
pub struct UpdateCruxParams<'info> {

    // Crux and Crux Manager
    #[account(mut, has_one = crux_manager)]
    pub crux: Box<Account<'info, Crux>>,
    pub crux_manager: Signer<'info>,

    // misc
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateCruxParams>, new_crux_fees: CruxFees) -> Result<()> {

    let crux = &mut ctx.accounts.crux;
    crux.crux_fees = new_crux_fees;

    msg!("Crux fees now {:?}", crux.crux_fees);
    Ok(())
}
