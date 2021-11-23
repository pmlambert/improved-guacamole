pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

contract GuildApp is AragonApp {
    bytes32 constant public SUMMON_ROLE = keccak256("SUMMON_ROLE");

    struct Channel {
        string name;
        bool strict;
        string discordServerId;
        string inviteChannel;
        string requirements;
    }

    uint256 public numChannels;

    mapping(uint256 => Channel) public channels;

    event Summon(uint256 channelId);

    function initialize() external onlyInit {}

    function summon(string name, bool strict, string discordServerId, string 
    inviteChannel, string requirements) external  {
        Channel memory channel = Channel(name, strict, discordServerId, inviteChannel, requirements);
    
        channels[numChannels] = channel;
    
        emit Summon(numChannels);
    
        numChannels++;
    }
}
