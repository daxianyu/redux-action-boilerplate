import { camelize, decamelize } from 'humps';
import invariant from './invariant';

/* Class to generate actions. */
export default class ActionCreator {
  /**
   * Transform string to String.
   * @param {string} string
   * @return {string}
   */
  static capitalise(string) {
    return string[0].toUpperCase() + string.slice(1);
  }

  /**
   * Create ACTION_TYPE, PREFIX/ACTION_TYPE and action creator.
   * @param {string} prefix
   * @param {string} actionName
   * @param {string} [suffix]
   * @return {object}
   */
  static createActionElements(prefix, actionName, suffix) {
    /* PREFIX, actionName, suffix => PREFIX/ACTION_NAME_SUFFIX. */
    let ACTION_TYPE = ActionCreator.toUnderscoreUpperCase(actionName);

    /* Append suffix to TYPE. */
    if (suffix) {
      const SUFFIX = ActionCreator.toUnderscoreUpperCase(suffix);
      ACTION_TYPE = `${ACTION_TYPE}_${SUFFIX}`;
    }

    const PREFIX_ACTION_TYPE = `${prefix}/${ACTION_TYPE}`;

    return {
      ACTION_TYPE,
      PREFIX_ACTION_TYPE,
      actionCreator: (payload) => {
        return {
          type: PREFIX_ACTION_TYPE,
          payload,
        };
      },
    };
  }

  /**
   * Process fault tolarent prefix and actions.
   * @param  {string} prefix
   * @param  {string[]} actions
   * @return {object}
   */
  static normaliseOptions(prefix, actions) {
    invariant(
      Array.isArray(actions),
      'actions expect to be type of array',
    );

    return {
      /* Prefix takes the form of SOME_PREFIX. */
      prefix: typeof prefix === 'string' ?
        ActionCreator.toUnderscoreUpperCase(prefix) :
        '',
      /* Actions takes the form of someActions. */
      actions: actions.map((action) => {
        return camelize(action);
      }),
    };
  }

  /**
   * Transform string from actionName to ACTION_NAME.
   * @param {string} string
   * @return {string}
   */
  static toUnderscoreUpperCase(string) {
    return decamelize(string, { separator: '_' }).toUpperCase();
  }

  constructor(options) {
    const { prefix, actions } = options;

    this.asyncSuffixes = [];

    this.$$normalisedOptions = ActionCreator.normaliseOptions(prefix, actions);
  }

  bindInstanceWithActions() {
    const { prefix, actions } = this.$$normalisedOptions;

    actions.forEach((action) => {
      const {
        ACTION_TYPE,
        PREFIX_ACTION_TYPE,
        actionCreator,
      } = ActionCreator.createActionElements(prefix, action);

      this.bindSyncAction(action, PREFIX_ACTION_TYPE, actionCreator);
      this.LEGACY_bindSyncAction(ACTION_TYPE, PREFIX_ACTION_TYPE);

      this.bindAsyncActions(prefix, action);
    });
  }

  /**
   * Bind sync action creator and action type on instance.
   * @param  {string} action
   * @param  {string} PREFIX_ACTION_TYPE
   * @param  {function} actionCreator
   */
  bindSyncAction(action, PREFIX_ACTION_TYPE, actionCreator) {
    /* Expose action creator on lower-cased property. */
    this[action] = actionCreator;
    /* Expose action type on TYPE property. */
    this[action].TYPE = PREFIX_ACTION_TYPE;
  }

  /**
   * Backward comaptibility.
   * @param  {string} ACTION_TYPE
   * @param  {string} PREFIX_ACTION_TYPE
   */
  LEGACY_bindSyncAction(ACTION_TYPE, PREFIX_ACTION_TYPE) {
    /* Expose action type on upper-cased property. */
    this[ACTION_TYPE] = PREFIX_ACTION_TYPE;
  }

  /* Bind bind async actions (i.e. success, failure) for an sync action. */
  bindAsyncActions(prefix, action) {
    this.asyncSuffixes.forEach((suffix) => {
      const {
        ACTION_TYPE: ASYNC_ACTION_TYPE,
        PREFIX_ACTION_TYPE: PREFIX_ASYNC_ACTION_TYPE,
        actionCreator: asyncActionCreator,
      } = ActionCreator.createActionElements(prefix, action, suffix);

      this.bindAsyncAction(action, suffix, PREFIX_ASYNC_ACTION_TYPE, asyncActionCreator);
      this.LEGACY_bindAsyncAction(action, suffix, ASYNC_ACTION_TYPE, PREFIX_ASYNC_ACTION_TYPE, asyncActionCreator);
    });
  }

  /**
   * Bind async action creator and action type on instance.
   * i.e. someActionSuccess, PREFIX/SOME_ACTION_SUCCESS.
   * @param  {string} action
   * @param  {suffix} suffix
   * @param  {string} PREFIX_ASYNC_ACTION_TYPE
   * @param  {function} asyncActionCreator
   */
  bindAsyncAction(action, suffix, PREFIX_ASYNC_ACTION_TYPE, asyncActionCreator) {
    const SUFFIX = suffix.toUpperCase();

    /* Expose action creator on lower-cased property. */
    this[action][suffix] = asyncActionCreator;
    /* Expose action type on upper-cased property. */
    this[action][SUFFIX] = PREFIX_ASYNC_ACTION_TYPE;
  }

  /**
   * Backward comaptibility.
   * @param  {string} action
   * @param  {suffix} suffix
   * @param  {string} ASYNC_ACTION_TYPE
   * @param  {string} PREFIX_ASYNC_ACTION_TYPE
   * @param  {function} asyncActionCreator
   */
  LEGACY_bindAsyncAction(action, suffix, ASYNC_ACTION_TYPE, PREFIX_ASYNC_ACTION_TYPE, asyncActionCreator) {
    const actionCreatorName = `${action}${ActionCreator.capitalise(suffix)}`;

    /* Expose action creator on lower-cased property. */
    this[actionCreatorName] = asyncActionCreator;
    /* Expose action type on upper-cased property. */
    this[ASYNC_ACTION_TYPE] = PREFIX_ASYNC_ACTION_TYPE;
  }
}
