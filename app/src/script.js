import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

app.store(
  async (state, { event, returnValues }) => {
    const nextState = {
      ...state,
    }


    try {
      switch (event) {
        case "Summon":
          const channelId = returnValues[0]
          return {
            ...nextState, channels: {
              ...nextState.channels, [channelId]: await getChannel(channelId)
            }
          }
        case 'Increment':
          return { ...nextState, count: await getValue() }
        case 'Decrement':
          return { ...nextState, count: await getValue() }
        case events.SYNC_STATUS_SYNCING:
          return { ...nextState, isSyncing: true }
        case events.SYNC_STATUS_SYNCED:
          return { ...nextState, isSyncing: false }
        default:
          return nextState
      }
    } catch (err) {
      console.log(err)
    }
  },
  {
    init: initializeState(),
  }
)

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

function initializeState() {
  return async cachedState => {
    const numChannels = parseInt(await app.call("numChannels").toPromise())
    const missingChannels = await Promise.all(
      new Array(numChannels)
        .filter((_, index) => !cachedState.channels[index])
        .map(async (_, index) => [index, await getChannel(index)]))

    const state = {
      ...cachedState,
      count: await getValue(),
      channels: {
        ...cachedState.channels,
      }
    }
    missingChannels.forEach(([index, channel]) => state.channels[index.toString()] = channel)

    if (Object.keys(state.channels).length == 0) state.channels =
    {
      "999": {
        name: "Guild 999",
        discordServerId: "07779da1c3826313ca6879bd97d619ee",
        inviteChannel: "https://discord.gg/ccas7ucd",
        strict: false,
        requirements: [
          { type: "ETHER", address: null, key: null, value: 0.1 }
        ]
      },
      "1000": {
        name: "My nth guild",
        // discordServerId: "07779da1c3826313ca6879bd97d619ee",
        // inviteChannel: "https://discord.gg/ccas7ucd",
        strict: true,
        requirements: [
          { type: "ERC20", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", key: null, value: 1 },
          { type: "ETHER", address: null, key: null, value: 0.1 },
          { type: "ERC721_Prop", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", key: "length", value: "long" },
          { type: "ERC721_Range", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", key: "size", value: [6, 12] },
          { type: "POAP", address: null, key: null, value: "2021-spacejam" }
        ]
      }
    }


    return state
  }
}

async function getChannel(channelId) {
  const response = await app.call("channels", channelId).toPromise()
  response.requirements = JSON.parse(response.requirements)
  return response
}

async function getValue() {
  return parseInt(await app.call('value').toPromise(), 10)
}
