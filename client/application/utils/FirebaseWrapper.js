import * as firebase from 'firebase';

export default class FirebaseWrapper {
  constructor(config) {
    this.configuration = config;

    firebase.initializeApp(this.configuration);

    this.database = firebase.database();
    this.authentication = firebase.auth();
    this.authentication.signOut();

    this.provider = new firebase.auth.GoogleAuthProvider();
  }

  /**
   * Gets the current active users uid which is used to reference in the database
   * @returns {string}
   */
  getUid() {
    return this.authentication.currentUser.uid;
  }

  /**
   * returns the current example users information from the firebase database
   * @returns {firebase.Promise.<void>}
   */
  getExampleUser() {
    return this.database.ref('users/example').once('value');
  }

  /**
   * returns all active notifications (active means actually existing) for that user
   * @returns {firebase.Promise.<void>}
   */
  getUserNotifications() {
    return this.database.ref(`users/${this.getUid()}/notifications`).once('value');
  }

  /**
   * removes a certain notificaitoon from the firebase database
   * @param key The key string for the index of the notification
   * @returns {firebase.Promise.<void>}
   */
  dismissNotification(key) {
    return this.database.ref(`users/${this.getUid()}/notifications/${key}`).remove();
  }

  /**
   * sets a welcome notification for new users being created on the system
   * @returns {Promise.<void>}
   */
  insertWelcomeNotification() {
    const insertingWelcomeNotification = this.database.ref(`users/${this.getUid()}/notifications`);

    const insertingNotificationKey = insertingWelcomeNotification.push({
      title: `Welcome ${this.authentication.currentUser.displayName}!`,
      message: 'Welcome to UniGoals! Any problems click the help button next to me!',
      timestamp: Date.now(),
    });
    return Promise.resolve(insertingNotificationKey.key);
  }

  addUniversityDetails(courseName, courseYear, courseUniversity) {
    this.database.ref(`users/${this.getUid()}/profile/course_name`).set(courseName);
    this.database.ref(`users/${this.getUid()}/profile/course_year`).set(courseYear);
    this.database.ref(`users/${this.getUid()}/profile/course_university`).set(courseUniversity);
    return Promise.resolve();
  }

  /**
   * Gets all the active units for the active google user
   * @returns {firebase.Promise.<*>}
   */
  getUnitsById() {
    return this.database.ref(`users/${this.getUid()}/units`).once('value');
  }

  /**
   * Gets the active users profile
   * @returns {firebase.Promise.<*>}
   */
  getProfileById() {
    return this.database.ref(`users/${this.getUid()}/profile`).once('value')
  }

  /**
   * Update user login count and set new date
   */
  updateLoginCountAndDate() {
    this.database.ref(`users/${this.getUid()}/profile/last_login`).set(Date.now());
    
    return this.database.ref(`users/${this.getUid()}/profile/login_count`).once('value')
    .then((snapshot) => {
      const count = snapshot.val();
      const newLoginCount = (count === null || count === undefined) ? 0 : count + 1;
      return this.database.ref(`users/${this.getUid()}/profile/login_count`).set(newLoginCount);
    });
  }

  /**
   * updates a units title in the firebase for the active user based on the unit key, validation
   * is done client and on the firebase database
   * @param change The change (string) happening on the server
   * @param key The key of the unit updating it.
   * @returns {firebase.Promise.<void>}
   */
  updateUnitTitle(change, key) {
    return this.database.ref(`users/${this.getUid()}/units/${key}/title`).set(change);
  }

  /**
   * Updates the courseName for the user on the profile
   * @param change The change to for the users profile
   * @returns {firebase.Promise.<void>}
   */
  updateProfileCourse(change) {
    return this.database.ref(`users/${this.getUid()}/profile/course_name`).set(change);
  }

  /**
   * update the content on a row for a unit, must contain the change, tablekey, rowKey and then
   * the column index which would be either (name, archieved or weighting)
   * @param change What is being changed
   * @param tableIndex The unit key
   * @param rowIndex the row key
   * @param columnIndex the type (name, archieved or weighting)
   * @returns {firebase.Promise.<void>}
   */
  updateUnitRowSection(change, tableIndex, rowIndex, columnIndex) {
    return this.database.ref(`users/${this.getUid()}/units/${tableIndex}/content/${rowIndex}/${columnIndex}`).set(change);
  }

  /**
   * deletes a unit row by unit and table index
   * @param unitRowKey the unit which row is being deleted
   * @param tableUnitKey the row key which is being deleted
   * @returns {firebase.Promise.<void>}
   */
  deleteUnitRowById(unitRowKey, tableUnitKey) {
    return this.database.ref(`users/${this.getUid()}/units/${tableUnitKey}/content/${unitRowKey}`).remove();
  }

  /**
   * inserts a new unit at the bottom of the units list
   * @returns {firebase.Promise.<*>}
   */
  insertUnitById() {
    return this.database.ref(`users/${this.getUid()}/units`).once('value')
      .then((currentUnitState) => {
        if (currentUnitState.numChildren() >= 8) {
          return Promise.reject(new Error('Only a maximum of 8 units at anyone time.'));
        }

        const insertUnitRef = this.database.ref(`users/${this.getUid()}/units`);
        const insertKey = insertUnitRef.push({ title: '', content: {} });
        return Promise.resolve(insertKey.key);
      });
  }

  /**
   * inserts a new row at the bottom of the unit
   * @param unitKey The unit key to insert into
   * @returns {firebase.Promise.<*>}
   */
  insertUnitRowById(unitKey) {
    return this.database.ref(`users/${this.getUid()}/units/${unitKey}/content`).once('value')
      .then((currentRowState) => {
        if (currentRowState.numChildren() >= 20) {
          return Promise.reject(new Error('Only a maximum of 20 unit rows at anyone time.'));
        }

        const insertingUnitRowRef = this.database.ref(`users/${this.getUid()}/units/${unitKey}/content`);
        const insertingUnitRowKey = insertingUnitRowRef.push({ name: 'Section', weighting: '0', achieved: '0' });
        return Promise.resolve(insertingUnitRowKey.key);
      });
  }

  /**
   * deletes a complete unit based on the unit key given (warning message given before hand)
   * @param unitIndex The unit index key used for this process
   * @returns {firebase.Promise.<void>}
   */
  deleteUnitById(unitIndex) {
    return this.database.ref(`users/${this.getUid()}/units/${unitIndex}`).remove();
  }

  /**
   * inserts into the help section with a message, name and email
   * @param message The message being stored
   * @param name The name of the user inserting it
   * @param email The email address of the person inserting.
   * @returns {Promise.<boolean>}
   */
  sendHelpMessage(message, name, email) {
    return this.database.ref('help').push({
      message,
      name,
      email,
      timestamp: Date.now(),
    })
      .then(() => Promise.resolve(true))
      .catch(error => Promise.reject(error));
  }

  /**
   * when a user is created, sample units are created, this is by using the above function
   * for inserting a unit and updating rows.
   */
  createSampleUnitsForNewUser() {
    const sampleOneRef = this.database.ref(`users/${this.getUid()}/units`);
    const sampleOneKey = sampleOneRef.push({ title: 'Example Unit', content: {} });

    this.insertUnitRowById(sampleOneKey.key)
      .then((unitRow) => {
        this.updateUnitRowSection('Coursework', sampleOneKey.key, unitRow, 'name');
        this.updateUnitRowSection('50', sampleOneKey.key, unitRow, 'weighting');
        this.updateUnitRowSection('71', sampleOneKey.key, unitRow, 'achieved');
      });

    this.insertUnitRowById(sampleOneKey.key)
      .then((unitRow) => {
        this.updateUnitRowSection('Exam', sampleOneKey.key, unitRow, 'name');
        this.updateUnitRowSection('50', sampleOneKey.key, unitRow, 'weighting');
        this.updateUnitRowSection('31', sampleOneKey.key, unitRow, 'achieved');
      });

    Promise.resolve();
  }

  /**
   * Gets the University Courses for the user
   */
  getUniversityCourses() {
    return this.database.ref('/universities/courses').once('value')
      .then(courses => Promise.resolve(courses.val()));
  }

  /**
   * Gets the current active University listings (all of the list in a array format)
   */
  getUniversityList() {
    return this.database.ref('/universities/uk').once('value')
      .then(list => Promise.resolve(list.val()));
  }

  /**
   * Returns all the University content stored in the database
   */
  getUniversityContents() {
    return this.database.ref('/universities').once('value')
      .then(content => Promise.resolve(content.val()));
  }

  // Gets a built ref for the live listeners for updated notifications
  getNotificationRef() {
    return this.database.ref(`users/${this.getUid()}/notifications`);
  }

  /**
   * creates a new user for which is called when a new sign in user happens
   * @param profile the profile of the user that is being created
   * @returns {firebase.Promise.<*>}
   */
  createNewUser(profile) {
    const {
      email,
      family_name: familyName,
      given_name: givenName,
      hd,
      name,
      picture,
    } = profile;

    return this.database.ref(`users/${this.getUid()}/profile`).set({
      given_name: familyName,
      family_name: givenName,
      email,
      picture,
      name,
      hd,
      last_login: Date.now(),
    })
      .then(() => this.createSampleUnitsForNewUser())
      .then(() => this.insertWelcomeNotification())
      .then(() => Promise.resolve(profile));
  }
}
