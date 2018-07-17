<template lang="pug">
  section.container
    Header(@executeButtonClick="onExecuteButtonClick")
    div.container(v-if="!authUser")
    div.container(v-if="authUser")
      div.box.stepContent#box1
        div.numberCircle
          p 1
        div.description
          h2 ターゲットを選択 
          p 介入されたくない会話をしているユーザーを選択します
        h3 
          span.icon.is-small
            i.fas.fa-list
          | リストから選択
        div.subcontainer#selectByList
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
        div.field
          p.control.has-icons-left
            input.input(v-model="userSearchQuery" placeholder="@id / 検索ワード")
            span.icon.is-small.is-left
              i.fas.fa-search
        div.subcontainer#selectBySearch
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
        div.subcontainer#selectResult
          img.profileImage.selectedUserProfileImage(v-for="user in selectedUsers" :src="user.profile_image_url_https")

      div.box.stepContent#box2
        div.numberCircle
          p 2
        div.description
          h2 オプションを設定 
          p ホワイトリストや検索件数などを設定します
        h3 
          span.icon.is-small
            i.fas.fa-handshake
          | ホワイトリスト
          small
            | 以下のユーザーをブロック対象から除外します
        div.subcontainer.stack#optionWhiteList
          div.control
            label.checkbox
              input(type="checkbox")
              | 自分がフォローしているユーザー
          div.control
            label.checkbox
              input(type="checkbox")
              | 自分のフォロワー
          div.control
            label.checkbox
              input(type="checkbox")
              | ターゲットがフォローしているユーザー
          div.control
            label.checkbox
              input(type="checkbox")
              | FF比が
              input.is-horizontal(type="text")
              | 以上のユーザー
        h3 
          span.icon.is-small
            i.fas.fa-cog
          | 検索件数設定
        div.subcontainer.stack#optionSearchParam
          div.field.is-horizontal
            div.field-label.is-normal
              label.label ターゲット内リプライ検索数
            div.field-body
              div.field
                div.control
                  input.input(:class="!validatePOYOPOYO ? 'is-danger' : ''" type="text")
                p.help.is-danger(v-if="!validatePOYOPOYO")
                  | This Field is required
          div.field.is-horizontal
            div.field-label.is-normal
              label.label ブロック対象ツイート検索数
            div.field-body
              div.field
                div.control
                  input.input(:class="!validatePOYOPOYO ? 'is-danger' : ''" type="text")
                p.help.is-danger(v-if="!validatePOYOPOYO")
                  | This Field is required
</template>

<script>
import axios from '~/plugins/axios'
import { mapState, mapGetters } from 'vuex'
import Header from '~/components/Header'
import ListItem from '~/components/ListItem'
import UserItem from '~/components/UserItem'

export default {
  components: {
    Header,
    ListItem,
    UserItem
  },
  async mounted () {
    if (this.$store.state.authUser) {
      await this.$store.dispatch('fetchUserProfile')
      await this.$store.dispatch('fetchUserLists')
    }
  },
  data () {
    return {
      totalUsersCount: 0,
      listSelection: {},
      userSelection: {},
      listSelectionMembers: [],
      userSearchQuery: '',
      userSearchResult: []
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
    }
  },
  computed: {
    userProfileImageUrl () {
      return this.userProfile ? this.userProfile.profile_image_url_https : ''
    },
    selectedUsers () {
      let result = []
      for (let key of Object.keys(this.listSelection)) {
        result = result.concat(this.listSelection[key])
      }
      for (let key of Object.keys(this.userSelection)) {
        result = result.concat(this.userSelection[key])
      }
      return result
    },
    validatePOYOPOYO () {
      return true
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
    async fetch () {
      await this.$store.dispatch('fetchUserFriends')
      await this.$store.dispatch('fetchUserFollowers')
    },
    async logout () {
      await this.$store.dispatch('logout')
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
    onExecuteButtonClick () {
      if (this.authUser) {

      }
      else {
        this.login()
      }
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
  padding: 50px 20px
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
    span
      margin-right: 1rem
    small
      margin-left: 1rem
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
  font-weight: 600
  font-size: 1.5rem
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

#optionWhiteList
  > *
    margin: 0.2rem 0px

#optionSearchParam
  .label
    width: 14rem
    font-weight: 400

.help
  text-align: left
</style>
