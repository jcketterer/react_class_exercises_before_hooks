import React, { Component } from 'react'
import axios from 'axios'
import Joke from './Joke'
import './JokeList.css'

class JokeList extends Component {
  static defaultProps = {
    numJokes: 10,
  }

  constructor(props) {
    super(props)
    this.state = {
      jokes: [],
    }
    this.createJoke = this.createJoke.bind(this)
    this.resetVotes = this.resetVotes.bind(this)
    this.toggleLock = this.toggleLock.bind(this)
    this.vote = this.vote.bind(this)
  }

  componentDidMount() {
    if (this.state.jokes.length < this.props.numJokes) this.getJoke()
  }
  componentDidUpdate() {
    if (this.state.jokes.length < this.props.numJokes) this.getJoke()
  }

  async getJoke() {
    try {
      let jokes = this.state.jokes
      let jokeVotes = JSON.parse(window.localStorage.getItem('jokeVotes') || '{}')
      let seenJoke = new Set(jokes.map(joke => joke.id))

      while (jokes.length < this.props.numJokes) {
        let res = await axios.get('https://icanhazdadjoke.com', {
          headers: { Accept: 'application/json' },
        })
        let { status, ...joke } = res.data

        if (!seenJoke.has(joke.id)) {
          seenJoke.add(joke.id)
          jokeVotes[joke.id] = jokeVotes[joke.id] || 0
          jokes.push({ ...joke, votes: jokeVotes[joke.id], locked: false })
        } else {
          console.log('duplicate joke')
        }
      }

      this.setState({ jokes })

      window.localStorage.setItem('jokeVotes', JSON.stringify(jokeVotes))
    } catch (e) {
      console.log(e)
    }
  }

  createJoke() {
    this.setState(state => ({ jokes: state.jokes.filter(joke => joke.locked) }))
  }

  resetVotes() {
    window.localStorage.setItem('jokeVotes', '{}')
    this.setState(state => ({
      jokes: state.jokes.map(joke => ({ ...joke, votes: 0 })),
    }))
  }

  vote(id, change) {
    let jokeVotes = JSON.parse(window.localStorage.getItem('jokeVotes'))
    jokeVotes[id] = (jokeVotes[id] || 0) + change
    window.localStorage.setItem('jokeVotes', JSON.stringify(jokeVotes))
    this.setState(state => ({
      jokes: state.jokes.map(joke =>
        joke.id === id ? { ...joke, votes: joke.votes + change } : joke
      ),
    }))
  }

  toggleLock(id) {
    this.setState(state => ({
      jokes: state.jokes.map(joke =>
        joke.id === id ? { ...joke, locked: !joke.locked } : joke
      ),
    }))
  }

  render() {
    let jokeSorted = [...this.state.jokes].sort((a, b) => (b.votes = a.votes))
    let jokesLocked = jokeSorted.filter(joke => joke.locked).length === this.props.numJokes

    return (
      <div className="JokeList">
        <button className="JokeList-getmore" onClick={this.createJoke} disabled={jokesLocked}>
          Get New Jokes
        </button>
        <button className="JokeList-getmore" onClick={this.resetVotes}>
          Reset all vote counts
        </button>

        {jokeSorted.map(joke => (
          <Joke
            text={joke.joke}
            key={joke.id}
            id={joke.id}
            votes={joke.votes}
            vote={this.vote}
            locked={joke.locked}
            toggleLock={this.toggleLock}
          />
        ))}

        {jokeSorted.length < this.props.numJokes ? (
          <div className="loading">
            <i className="fas fa-4x fa-spinner fa-spin" />
          </div>
        ) : null}
      </div>
    )
  }
}

export default JokeList
