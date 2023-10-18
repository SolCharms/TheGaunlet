# The Gauntlet

### Solana's Social Engagement Layer 

Complete Challenges. Climb your way to the top of the Leaderboard. Earn Reputation & Rewards.

## Deployments

The Gauntlet is now deployed on both devnet and **mainnet**. The program address is the same for both and is listed below.

Program ID: 

    CRuXQ86F4m6VfRHa7VACNbQKJoSioG3gcpui9BH2YNWa

Users can interact with mainnet deploy of The Gauntlet via the web application https://thegauntlet.xyz/

## Prelude

Open the terminal and cd into the desired working directory (For me it's ~/Development/Solana/SDKs).

Clone the Repository using the command 'git clone'. You should now have a local copy of the project as something like ~/Development/Solana/SDKs/TheGauntlet/

To conveniently use the program's CLI functionality from any directory without having to account for relative paths or typing out the absolute path to the CLI's directory every time, we will create a shorthand path alias. Open your .bashrc file (located in the Home directory) and add the following line at the bottom of the textfile:

alias crux-cli='ts-node ~/Development/Solana/SDKs/The Gauntlet/src/challenger.cli.ts'

accounting for the fact that your path to the challenger.cli.ts file may be slightly different depending on where in your filesystem you put the cloned repository.

The remainder of this demonstration assumes a familiarity with Solana's CLI. You will need to create filesystem wallet keypairs and airdrop yourself some Solana to follow along with the demo.

## Configuration

In order to use the program we need to create some filesystem wallets and then configure the .ts files in ../TheGauntlet/src/cli-configs/devnet/

To make filesystem wallets run the Solana CLI command:

    solana-keygen new --outfile ~/path-to-file/name-of-file.json
    
I've gone ahead and created 4 wallets and airdropped each of them about 1 Sol (much more than enough for our purposes).

- /home/SolCharms/.config/solana/devnet-challenger/crux_manager.json
- /home/SolCharms/.config/solana/devnet-challenger/user_1.json
- /home/SolCharms/.config/solana/devnet-challenger/user_2.json
- /home/SolCharms/.config/solana/devnet-challenger/user_3.json

There are 4 configuration files and we will edit them as needed throughout the demonstration. They are:

   - the network configuration
   - the crux configuration
   - the challenge configuration
   - the submission configuration
   
The choice for using configuration files, at least from a protocol management perspective, was two-fold. For one, since there are often multiple public keys / numerical values required by many of the commands, and managers can have a multitude of accounts of each type, storage files would be necessary anyways. And secondly, entering multiple options in the process of a command would require a tedious copying/pasting process which configuration files ultimately forego. Nonetheless, the command line interface built here tries to be as flexible as possible, forcing you to use configuration files when it is absolutely in your best interest and otherwise giving you the flexibility to enter options manually.

The network configuration (../cli_configs/devnet/networkConfig-devnet.ts) is necessary right away. We will first set up the configuration from the perspective of someone who will initialize and manage a crux, i.e the crux manager. (Later we will also do it from the perspective of other users including protocol moderators). Two inputs are required:

    the clusterApiUrl
    the signerKeypair

Here's what mine looks like:

![Screenshot from 2023-10-18 18-54-51](https://github.com/SolCharms/TheGaunlet/assets/97003046/208be47a-baa1-4467-98cc-6408eedf2ac6)

## Initializing a Crux Account

The crux is where all the backend business takes place. It is an account that stores all the data needed protocol-wide including managerial pubkeys and protocol fees. The crux is a key design element of the program, since it allows any team to set up their own instance of what is essentially 'The Gauntlet' in parallel to the one instantiated by xAndria, independently managed, and with its own fee structure. Think of it as having all the functionality of cloning the deployment of the program - without having to clone and redeploy the program. Any number of cruxs can exist simultaneously and there is absolutely zero interaction between them. This design was specifically chosen as one of the main features of 'The Gauntlet' is its reputation tracking and leaderboards. If the data from cruxs could interact, then one team's challenges could affect another's and thus destroy the value of having a reputation system altogether. (As an example, consider one team having challenges ranging from 25-100 reputation points and another having challenges which range from 1,000-10,000.) 

To initialize a crux account, one must decide on the two protocol fees - the profile fee and the submission fee - and input them into the config file (../cli_configs/devnet/cruxConfig-devnet.ts). Here, I've chosen to use relatively small fees (which are indeed far less than the rent for the profile and submission accounts themselves):

![Screenshot from 2023-10-18 19-16-59](https://github.com/SolCharms/TheGaunlet/assets/97003046/d008958f-a9a7-4ff3-b4af-73580d4fd198)






























