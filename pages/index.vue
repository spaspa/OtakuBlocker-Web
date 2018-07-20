<template lang="pug">
  section.container
    Modal(v-if="showModal"
          @modalCancel="onModalCancel"
          @modalConfirm="onModalConfirm")
      .modal-body(slot="body")
        | API制限に達しました。
        br
        | ホワイトリスト等の機能が動作しない可能性がありますが、続けますか？
      .modal-footer(slot="footer")
        .button.is-danger.is-outline(@click="onModalCancel")
          | やめる
        .button.is-primary.is-outline(@click="onModalConfirm")
          | 続ける
    Header(@executeButtonClick="onExecuteButtonClick")
    .container(v-if="!authUser")
    .container(v-if="authUser && executionStage === 0")
      .box.stepContent#box1
        .numberCircle
          p 1
        .description
          h2 ターゲットを選択 
          p 介入されたくない会話をしているユーザーを選択します
        h3 
          span.icon.is-small
            i.fas.fa-list
          | リストから選択
        .subcontainer#selectByList
          ListItem(v-for="list in userLists"
                   :list="list"
                   :selected="list.id in listSelection"
                   :key="list.id"
                   @listItemSelect="onListItemSelect"
                   @listItemUnselect="onListItemUnselect")
        h3 
          span.icon.is-small
            i.fas.fa-search
          | ユーザーを検索
        .field
          p.control.has-icons-left
            input.input(v-model="userSearchQuery" placeholder="@id / 検索ワード")
            span.icon.is-small.is-left
              i.fas.fa-search
        .subcontainer#selectBySearch
          UserItem(v-for="user in userSearchResult"
                   :user="user"
                   :selected="selectedUsers.some(e => e.id == user.id)"
                   :key="user.id"
                   @userItemSelect="onUserItemSelect"
                   @userItemUnselect="onUserItemUnselect")
        h3 
          span.icon.is-small
            i.fas.fa-user
          | 追加したユーザー
          small(v-if="totalUsersCount > selectedUsers.length")
            | 20人を超えるリストは一部のみ表示しています
        .subcontainer#selectResult
          img.profileImage.selectedUserProfileImage(v-for="user in selectedUsers" :src="user.profile_image_url_https")

      .box.stepContent#box2
        .numberCircle
          p 2
        .description
          h2 オプションを設定 
          p ホワイトリストや検索件数などを設定します
        h3 
          span.icon.is-small
            i.fas.fa-handshake
          | ホワイトリスト
          small
            | 以下のユーザーをブロック対象から除外します
        .subcontainer.stack#optionsWhiteList
          .control
            label.checkbox
              input(type="checkbox" v-model="whitelistSettings.myFriend")
              | 自分がフォローしているユーザー
          .control
            label.checkbox
              input(type="checkbox" v-model="whitelistSettings.myFollower")
              | 自分のフォロワー
          .control
            label.checkbox
              input(type="checkbox"
                    v-model="whitelistSettings.targetsFriend"
                    :disabled="apiLimitExceed || totalUsersCount >= 15")
              | ターゲットがフォローしているユーザー
              p.help.is-danger(v-if="totalUsersCount >= 15")
                | 15人以上選択時にこの機能は使えません
              p.help.is-danger(v-if="apiLimitExceed")
                | API制限を超えています
          .control
            label.checkbox
              input(type="checkbox" v-model="whitelistSettings.ffRate")
              | FF比が{{ params.ffRateThreshold }}以上のユーザー
        h3 
          span.icon.is-small
            i.fas.fa-cog
          | 詳細設定
        .subcontainer.stack#optionsSearchParam
          .field.is-horizontal
            .field-label.is-normal
              label.label ターゲット内リプライ検索数
            .field-body
              .field
                .control
                  input.input(:class="validateRepliesToSearch ? 'is-danger' : ''" type="text"
                              v-model.number="params.repliesToSearch")
                p.help.is-danger(v-if="validateRepliesToSearch === 1")
                  | API制限({{ maximumRepliesToSearch }})を超えています
          .field.is-horizontal
            .field-label.is-normal
              label.label ブロック対象ツイート検索数
            .field-body
              .field
                .control
                  input.input(:class="validateTweetsToSearch ? 'is-danger' : ''" type="text"
                              v-model.number="params.tweetsToSearch")
                p.help.is-danger(v-if="validateTweetsToSearch === 1")
                  | API制限({{ maximumTweetsToSearch }})を超えています
          .field.is-horizontal
            .field-label.is-normal
              label.label FF比ホワイトリストしきい値
            .field-body
              .field
                .control
                  input.input(v-model.number="params.ffRateThreshold")
    .container(v-if="authUser && executionStage === 1")
</template>

<script>
import axios from '~/plugins/axios'
import { mapState, mapGetters } from 'vuex'
import Header from '~/components/Header'
import ListItem from '~/components/ListItem'
import UserItem from '~/components/UserItem'
import Modal from '~/components/Modal'

export default {
  components: {
    Header,
    ListItem,
    UserItem,
    Modal
  },
  async mounted () {
    if (this.$store.state.authUser) {
      await this.$store.dispatch('fetchUserProfile')
      await this.$store.dispatch('fetchUserLists')
    }
  },
  data () {
    return {
      showModal: false,
      executionStage: 0,
      totalUsersCount: 0,
      listSelection: {},
      userSelection: {},
      listSelectionMembers: [],
      userSearchQuery: '',
      userSearchResult: [],
      apiLimitExceed: false,
      generalSettings: {
        excludeSelfReply: true
      },
      whitelistSettings: {
        myFriend: true,
        myFollower: true,
        targetsFriend: true,
        ffRate: false
      },
      params: {
        repliesToSearch: 500,
        tweetsToSearch: 10000,
        ffRateThreshold: 3
      },
      targetIds: new Set(),
      targetScreenNames: new Set(),
      whitelist: new Set(),
      replies: new Set(),
      searchQueries: new Set(),
      otakuIds: new Set()
    }
  },
  watch: {
    async userSearchQuery (newVal, oldVal) {
      if (!newVal) {
        this.userSearchResult = []
        return
      }
      const apiPath = newVal.startsWith('@')
        ? '/api/twitter/users/show'
        : '/api/twitter/users/search'
      const params = newVal.startsWith('@')
        ? {
          screen_name: newVal.substring(1)
        }
        : {
          q: newVal,
          count: 5,
          include_entities: false
        }
      const { data } = await axios.get(apiPath, { params })
      this.userSearchResult = Array.isArray(data) ? data : [data]
    },
    totalUsersCount (newVal, oldVal) {
      if (newVal >= 15) {
        this.whitelistSettings.targetsFriend = false
      }
      else if (oldVal >= 15 && newVal < 15) {
        this.whitelistSettings.targetsFriend = true
      }
    }
  },
  computed: {
    userProfileImageUrl () {
      return this.userProfile ? this.userProfile.profile_image_url_https : ''
    },
    selectedUsers () {
      const result = []
      for (let key of Object.keys(this.listSelection)) {
        result.push(...this.listSelection[key])
      }
      for (let key of Object.keys(this.userSelection)) {
        result.push(this.userSelection[key])
      }
      return result
    },
    maximumRepliesToSearch () {
      return Math.floor(900 / (this.totalUsersCount <= 1 ? 1 : this.totalUsersCount)) * 200
    },
    maximumTweetsToSearch () {
      return 180 * 100
    },
    validateRepliesToSearch () {
      const parsed = parseInt(this.params.repliesToSearch)
      if (parsed > this.maximumRepliesToSearch) {
        return 1
      }
      return 0
    },
    validateTweetsToSearch () {
      const parsed = parseInt(this.params.tweetsToSearch)
      if (parsed > this.maximumTweetsToSearch) {
        return 1
      }
      return 0
    },
    ...mapState([
      'authUser',
      'userProfile',
      'userLists',
      'userFriendIds',
      'userFollowersIds'
    ]),
    ...mapGetters([
      'userName',
      'userScreenName',
      'userProfileImageUrl'
    ])
  },
  methods: {
    login () {
      location.href = '/api/auth'
    },
    async logout () {
      await this.$store.dispatch('logout')
    },
    async execute () {
      if (!this.showModal && this.whitelist.size === 0) {
        await this.prepareWhitelist()
      }
      if (!this.showModal && this.replies.size === 0) {
        await this.fetchReplies()
      }
      if (!this.showModal && this.otakuIds.size === 0) {
        await this.searchTweets()
      }
      if (!this.showModal && this.otakuIds.size !== 0) {
        await this.executeBlock()
      }
    },
    async prepareWhitelist () {
      // generate targets
      Object.keys(this.userSelection).forEach(id => {
        this.targetIds.add(id)
        this.targetScreenNames.add('@' + this.userSelection[id].screen_name)
        console.log('[wlist] add @' + this.userSelection[id].screen_name)
      })
      for (let id of Object.keys(this.listSelection)) {
        const { data } = await axios.get('/api/twitter/util/concat_cursor/lists/members', {
          params: {
            list_id: id,
            key: 'users'
          }
        })
        data.forEach(user => {
          this.targetIds.add(user.id_str)
          this.targetScreenNames.add('@' + user.screen_name)
          console.log('[wlist] add @' + user.screen_name)
        })
      }
      // generate whitelist
      const rawWhitelist = []
      this.targetIds.forEach(id => {
        rawWhitelist.push(id)
      })
      if (this.whitelistSettings.myFriend) {
        try {
          await this.$store.dispatch('fetchUserFriendIds')
          rawWhitelist.push(...this.$store.state.userFriendIds)
        }
        catch (err) {
          this.apiLimitExceed = true
          this.showModal = true
        }
      }
      if (this.whitelistSettings.myFollower) {
        try {
          await this.$store.dispatch('fetchUserFollowersIds')
          rawWhitelist.push(...this.$store.state.userFollowersIds)
        }
        catch (err) {
          this.apiLimitExceed = true
          this.showModal = true
        }
      }
      if (this.whitelistSettings.targetsFriend) {
        for (let id of this.targetIds) {
          try {
            const { data } = await axios.get('/api/twitter/util/concat_cursor/friends/ids', {
              params: {
                id: id,
                key: 'ids'
              }
            })
            rawWhitelist.push(...data)
          }
          catch (err) {
            console.log(err)
            this.apiLimitExceed = true
            this.showModal = true
          }
        }
      }
      this.whitelist = new Set(rawWhitelist)
    },
    async fetchReplies () {
      for (let id of this.targetIds) {
        try {
          const res = await axios.get('/api/twitter/util/concat_id/statuses/user_timeline', {
            params: {
              user_id: id,
              max_count: 200,
              count: this.params.repliesToSearch,
              include_rts: false
            }
          })
          console.log(res)
          const data = res.data
          data.forEach(status => {
            const replyUserId = status.in_reply_to_user_id_str
            const replyUserScreenName = status.in_reply_to_screen_name
            if (replyUserId
                && this.targetIds.has(replyUserId)
                && !(this.generalSettings.excludeSelfReply && replyUserId === status.user.id_str)) {
              this.replies.add(status.id_str)
              if (!(this.searchQueries.has('@' + status.user.screen_name + ' @' + replyUserScreenName)
                    || this.searchQueries.has('@' + replyUserScreenName + ' @' + status.user.screen_name))) {
                this.searchQueries.add('@' + status.user.screen_name + ' @' + replyUserScreenName)
                console.log('[reply] add ' + '@' + status.user.screen_name + ' @' + replyUserScreenName)
              }
            }
          })
        }
        catch (err) {
          this.apiLimitExceed = true
          this.showModal = true
          return
        }
      }
    },
    async searchTweets () {
      const count = Math.floor(this.params.tweetsToSearch / this.searchQueries.size)
      for (let q of this.searchQueries) {
        try {
          const { data } = await axios.get('/api/twitter/util/search_tweets', {
            params: {
              q: q + ' exclude:retweets',
              count: count
            }
          })
          data.forEach(status => {
            if (!(this.whitelist.has(status.user.id_str))) {
              this.otakuIds.add(status.user.id_str)
              console.log('[search] add ' + status.user.screen_name)
            }
          })
        }
        catch (err) {
          this.apiLimitExceed = true
          this.showModal = true
          return
        }
      }
    },
    async executeBlock () {
      console.log('Will block ' + this.otakuIds.size)
    },
    onExecuteButtonClick () {
      if (this.authUser) {
        this.whitelist = new Set([])
        this.execute()
      }
      else {
        this.login()
      }
    },
    async onListItemSelect (id) {
      const { data } = await axios.get('/api/twitter/lists/members', {
        params: {
          list_id: id
        }
      })
      // 正しくは重複除去が必要
      this.totalUsersCount += this.$store.state.userLists.find(e => e.id === id).member_count
      this.$set(this.listSelection, id, data.users)
    },
    onListItemUnselect (id) {
      this.totalUsersCount -= this.$store.state.userLists.find(e => e.id === id).member_count
      this.$delete(this.listSelection, id)
    },
    onUserItemSelect (id) {
      this.totalUsersCount += 1
      const user = this.userSearchResult.find((val, index, arr) => val.id === id)
      this.$set(this.userSelection, id, user)
    },
    onUserItemUnselect (id) {
      if (id in this.userSelection) {
        this.totalUsersCount -= 1
        this.$delete(this.userSelection, id)
      }
    },
    onModalCancel () {
      this.showModal = false
    },
    onModalConfirm () {
      this.showModal = false
      this.execute()
    }
  }
}
</script>

<style lang="sass" scoped>
@import "~/assets/css/main.sass"

.profileImage
  border-radius: 50%

@mixin disable-button-styling
  border: none
  cursor: pointer
  outline: none
  padding: 0
  appearance: none
  text-decoration: none

.authButton
  @include disable-button-styling
  width: 12rem
  height: 4rem
  font-size: 1.1rem
  text-align: center
  text-decoration: none
  border-radius: 3px
  border: solid 1px #00aced
  background: #ffffff
  color: #00aced
  transition: all 0.2s ease

  &:hover
    background: #00aced
    color: #ffffff

.container
  padding: 50px 15px 50px 20px
  max-width: 950px
  align-items: center

.box
  border-width: 0px !important

.stepContent
  position: relative
  padding: 25px
  display: flex
  flex-direction: column
  align-items: start
  h3
    font-size: 1rem
    font-weight: 600
    color: $primary
    margin-bottom: 0.5rem
    text-align: left
    span
      margin-right: 1rem
    small
      display: block
      margin-left: 2rem
      font-size: 0.7rem
      font-weight: 400

.numberCircle
  position: absolute
  top: 6px
  left: -30px
  width: 60px
  height: 60px
  background: $primary
  border-radius: 50%
  color: white
  font-family: 'Quicksand', sans-serif
  font-weight: 600
  font-size: 1.6rem
  display: flex
  align-items: center
  justify-content: center
  box-shadow: 2px 2px 6px 0px rgba(0, 0, 0, 0.1)


.description
  display: flex
  flex-direction: column
  color: $primary
  align-items: start
  padding-left: 20px
  margin-bottom: 1.5rem
  text-align: left
  h2
    font-size: 1.2rem
    font-weight: 600
    color: $primary
    margin-bottom: 0.5rem
  p
    font-size: 0.8rem

.subcontainer
  width: 100%
  display: flex
  flex-wrap: wrap

  &:not(:last-child)
    margin-bottom: 1.5rem

.stack
  flex-direction: column

.tile.is-child.box
  margin: 10px

.selectedUserProfileImage
  margin: 0.2rem

.checkbox
  input
    margin-right: 0.5rem
    transform: translateY(-1px)

#optionsWhiteList
  > *
    margin: 0.2rem 0px

#optionsSearchParam
  .label
    width: 14rem
    font-weight: 400

.help
  text-align: left

.modal-footer
  margin: 1rem
  > *
    margin: 0rem 1rem
    font-width: 600
</style>
