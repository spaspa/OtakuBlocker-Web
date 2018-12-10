<template lang="pug">
  section
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
    Header(:status="executionStage === 5 ? 'Done' : executionStage > 0 ? 'Wait' : ''"
           :disabled="executionStage > 0 && executionStage !== 5"
           :startable="selectedUsers.length >= 2"
           :executing="executionStage >= 1"
           @executeButtonClick="onExecuteButtonClick"
           @logoutClick="logout")
    .titleBox(:class="!authUser ? 'shiftedForBaloon' : ''")
      .titleBg
      .titleMain
        h1 Otaku Blocker
        small 会話に割り込むオタクよさらば！
    .container.shiftedForBaloon(v-if="!authUser")
      .box.stepContent
        .numberCircle
          p ?
        .topDescription
          h2 Otaku Blockerとは？
          img.otakublockerImage(src="~/assets/img/otakublocker-image.svg")
          p オフィシャルな人物同士の会話の途中にリプライを送るような、
          strong.lessStrong 触るな〜！！
          strong.lessStrong なぜ参加しようとする
          strong 見てて！
          strong.moreStrong ただただ見てて！
          p ……と言いたくなる人たちをブロックするツールです！
    .container.shiftedForBaloon(v-if="!authUser")
      .box.stepContent
        .numberCircle
          p #
        .topDescription
          h2 使い方
          ol
            li 上のボタンからTwitterにログイン
            li 会話に介入されたくないユーザーをリストで選択するか、ユーザを検索して指定します
            li
              | オプションを確認して、
              span.icon
                i.fas.fa-ban
              | ボタンで実行！
    .container(v-if="authUser" :class="executionStage === 0 ? 'mainContainerActive' : 'mainContainerInActive'")
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
            i.fas.fa-cog
          | 動作設定
        .subcontainer.stack#optionsWhiteList
          .control
            label.checkbox
              input(type="checkbox" v-model="generalSettings.useMute")
              | ブロックの代わりにミュートを使う
          .control
            label.checkbox
              input(type="checkbox" v-model="generalSettings.expressMode")
              | 高速モード(検索クエリを全パターン作成する)
              p.help.is-danger(v-if="totalUsersCount >= 20"
                               :disabled="totalUsersCount >= 20")
                | 20人以上選択時にこの機能は使えません
          .control
            label.checkbox
              input(type="checkbox" v-model="generalSettings.dryRun")
              | dry-run(対象の検索まで行い、{{ blockMethodString }}を実行しない)
        h3 
          span.icon.is-small
            i.fas.fa-handshake
          | ホワイトリスト
          small
            | 以下のユーザーを{{ blockMethodString }}対象から除外します
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
            i.fas.fa-cogs
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
              label.label {{ blockMethodString }}対象ツイート検索数
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
    .container(:class="!authUser ? 'shiftedForBaloon marginForFooter' : ''")
      .box.stepContent
        .numberCircle
          p !
        .description
          h2 注意事項
          .warning
            h3
              span.icon
                i.fas.fa-bomb
              | 処理前の確認
            p ボタンを押した時点で処理が開始されます。処理前に確認は行いません。
          .warning
            h3
              span.icon
                i.fas.fa-hand-paper
              | APIの制限
            p Twitter APIの制限から、遡れるツイートは1週間前までのものです。また、対象となるユーザーは検索できる範囲のもののみであり、それ以外の対象とすべきすべてのユーザーに対して処理を実行するものではありません。
          .warning
            h3
              span.icon
                i.fas.fa-exclamation-triangle
              | 免責事項
            p 当サイトを利用し利用者、または第三者に生じた損害・損失について、製作者はいかなる責任も負いかねます。
    .statusArea(:class="classStatusArea")
      .statusAreaBg(:class="classStatusAreaBg")
      transition
        .statusDetail(v-if="executionStage >= 1")
          .statusStep
            p 1
          .statusDescription
            p {{ stage1Description }}
      transition
        .statusDetail(v-if="executionStage >= 2")
          .statusStep
            p 2
          .statusDescription
            p {{ stage2Description }}
      transition
        .statusDetail(v-if="executionStage >= 3")
          .statusStep
            p 3
          .statusDescription
            p {{ stage3Description }}
      transition
        .statusDetail(v-if="executionStage >= 4")
          .statusStep
            p 4
          .statusDescription
            p {{ stage4Description }}
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
        useMute: false,
        expressMode: true,
        dryRun: false
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
      otakuIds: new Set(),
      blockedCount: 0
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
      if (newVal >= 20) {
        this.generalSettings.expressMode = false
      }
      else if (oldVal >= 20 && newVal < 20) {
        this.generalSettings.expressMode = true
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
    blockMethodString () {
      return this.generalSettings.useMute ? 'ミュート' : 'ブロック'
    },
    classStatusArea () {
      return this.executionStage > 0 ? 'statusAreaActive' : 'statusAreaInActive'
    },
    classStatusAreaBg () {
      return this.executionStage > 0 ? 'statusAreaBgActive' : 'statusAreaBgInActive'
    },
    stage1Description () {
      if (this.executionStage === 1) {
        return 'ホワイトリストを作成しています...'
      }
      else {
        return `${this.whitelist.size}件のホワイトリストを作成しました！`
      }
    },
    stage2Description () {
      if (this.executionStage === 2) {
        return '検索クエリを作成しています...'
      }
      else {
        return `${this.searchQueries.size}件の検索クエリを作成しました！`
      }
    },
    stage3Description () {
      if (this.executionStage === 3) {
        return 'ツイートを検索しています...'
      }
      else {
        return `${this.otakuIds.size}人の${this.blockMethodString}対象ユーザーを発見しました！`
      }
    },
    stage4Description () {
      if (this.generalSettings.dryRun) {
        return `dry-runが有効のため${this.blockMethodString}を実行しませんでした`
      }
      if (this.executionStage === 4) {
        return `${this.blockMethodString}を実行しています...`
      }
      else {
        return `${this.blockedCount}人${this.blockMethodString}しました！`
      }
    },
    ...mapState([
      'scrollY',
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
      this.$store.dispatch('logout')
      location.href = '/api/auth/logout'
    },
    async execute () {
      if (!this.showModal && this.executionStage < 1) {
        await this.prepareWhitelist()
      }
      if (!this.showModal && this.executionStage < 2) {
        await this.createQueries()
      }
      if (!this.showModal && this.executionStage < 3) {
        await this.searchTweets()
      }
      if (!this.showModal && this.executionStage < 4) {
        await this.executeBlock()
      }
    },
    async prepareWhitelist () {
      this.executionStage = 1
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
    async createQueries () {
      this.executionStage = 2
      const targetScreenNamesList = Array.from(this.targetScreenNames)
      if (this.generalSettings.expressMode) {
        let index = 0
        targetScreenNamesList.slice(0, targetScreenNamesList.length - 1).forEach(s1 => {
          targetScreenNamesList.slice(index + 1).forEach(s2 => {
            this.searchQueries.add(`${s1} ${s2}`)
          }, this)
          index += 1
        }, this)
      }
      else {
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
                  && replyUserId !== status.user.id_str) {
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
      }
    },
    async searchTweets () {
      this.executionStage = 3
      /// const actualQueries = []
      // Got less results with this method
      // for (let q of this.searchQueries) {
      //   if (actualQueries.length === 0) {
      //     actualQueries.push(q)
      //   }
      //   // consider " OR " and "exclude:retweets"
      //   else if (actualQueries[actualQueries.length - 1].length + q.length + 4 < 480) {
      //     actualQueries[actualQueries.length - 1] += ' OR ' + q
      //   }
      //   else {
      //     actualQueries.push(q)
      //   }
      // }
      // const count = Math.floor(this.params.tweetsToSearch / actualQueries.length)
      const count = Math.floor(this.params.tweetsToSearch / this.searchQueries.size)
      for (let q of this.searchQueries) {
        console.log(`[search] '${q}' @ ${count}`)
        try {
          const { data } = await axios.get('/api/twitter/util/search_tweets', {
            params: {
              q: q + ' exclude:retweets',
              count: count
            }
          })
          data.forEach(status => {
            if (status.in_reply_to_status_id
                && !(this.whitelist.has(status.user.id_str))
              && !(this.whitelistSettings.ffRate && status.user.followers_count / status.user.friends_count >= this.params.ffRateThreshold)) {
              this.otakuIds.add(status.user.id_str)
              console.log('[search] add ' + status.user.screen_name)
            }
          })
        }
        catch (err) {
          this.apiLimitExceed = true
          continue
        }
      }
      if (this.apiLimitExceed) {
        this.showModal = true
      }
    },
    async executeBlock () {
      this.executionStage = 4
      if (this.generalSettings.dryRun) {
        return
      }
      const apiPath = this.generalSettings.useMute ? '/mutes/users/create' : '/blocks/create'
      for (let user_id of this.otakuIds) {
        try {
          axios.post('/api/twitter' + apiPath, { user_id })
        }
        catch (err) {
          console.log(err)
          continue
        }
        this.blockedCount += 1
      }
      this.executionStage = 5
    },
    onExecuteButtonClick () {
      if (this.executionStage === 5) {
        location.href = `http://twitter.com/share?url=${process.env.url}&text=${this.targetIds.size}人の会話を守りました！&hashtags=OtakuBlocker`
      }
      else if (this.authUser) {
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
      this.executionStage = 0
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

.container
  padding: 20px 30px 50px 40px
  max-width: 975px
  align-items: center

.box
  border-width: 0px !important

.mainContainerActive
  transition: all 0.2s ease
  transform: translateY(0px)

.mainContainerInActive
  transition: all 0.2s ease
  transform: translateY(100vh)

.titleBox
  width: 100vw
  height: 15rem
  position: relative
  display: flex
  justify-content: center

.titleBox
  +mobile
  height: 15rem

.shiftedForBaloon
  transform: translateY(100px)
  &.marginForFooter
    margin-bottom: 100px

.titleBg
  width: 300%
  height: 200%
  background: $primary
  position: absolute
  transform: rotate(-10deg) translate(0, -50%)

.titleMain
  position: absolute
  top: 100px
  color: #ffffff
  text-align: center
  h1
    font-family: 'Quicksand', sans-serif
    font-size: 5rem
    font-weight: 600
  h1
    +mobile
    font-size: 2.5rem

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
  box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2)

.topDescription
  display: flex
  flex-direction: column
  color: $primary
  align-items: start
  padding-left: 20px
  margin-bottom: 0.5rem
  text-align: left
  line-height: 2rem
  h2
    font-size: 1.2rem
    font-weight: 600
    color: $primary
    margin-bottom: 1rem
  strong
    color: $primary
    font-size: 1.2rem
    line-height: 3rem
  strong.lessStrong
    font-size: 1.0rem
    line-height: 2.7rem
  strong.moreStrong
    font-size: 1.5rem
  ol
    margin-left: 1rem
  li
    line-height: 2.3rem

.description
  display: flex
  flex-direction: column
  color: $primary
  align-items: start
  padding-left: 20px
  margin-bottom: 0.5rem
  text-align: left
  h2
    font-size: 1.2rem
    font-weight: 600
    color: $primary
    margin-bottom: 0.5rem
  p
    font-size: 0.8rem

.warning
  margin: 1rem 0px

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
  margin: 1rem 0px
  > *
    margin: 0px 0.5rem
    font-width: 600

.statusArea
  position: fixed
  top: 220px
  left: 0px
  display: flex
  align-items: center
  flex-direction: column
  width: 100vw

.statusAreaInActive
  opacity: 0

.statusAreaActive
  opacity: 1

.statusDetail
  width: 70vw
  max-width: 500px
  display: flex
  align-items: center
  margin: 1rem

.statusStep
  width: 40px
  height: 40px
  min-width: 40px
  min-height: 40px
  background: #ffffff
  color: $primary
  font-family: 'Quicksand', sans-serif
  border-radius: 50px
  font-weight: 600
  font-size: 1.2rem
  display: flex
  align-items: center
  justify-content: center

.statusDescription
  color: white
  margin-left: 1rem
  font-weight: 400

.statusAreaBg
  z-index: -1
  background-color: $primary
  position: fixed
  border-radius: 50%
  position: fixed
  top: 10px
  left: 50vw

.statusAreaBgInActive
  transition: all 0.1s ease
  width: 10px
  height: 10px
  transform: translateY(-5px, -5px)

.statusAreaBgActive
  transition: all 2s cubic-bezier(0,.79,.31,.87)
  width: 300vh
  height: 300vh
  transform: translate(-150vh, -150vh)

</style>
