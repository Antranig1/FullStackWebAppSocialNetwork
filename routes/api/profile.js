const express = require('express');
const config = require('config');
const request = require('request');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { check, validationResult } = require('express-validator');
//@route  Get api/profile/me
//@desc   Get current users profile
//@access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate(['user', 'name', 'avatar']);

    //If there is no profile
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    //If there is a profile
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

//@route  POST api/profile
//@desc   Create or Update user profile
//@access Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
    } = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (location) profileFields.location = location;
    if (website) profileFields.website = website;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    //create a map of values
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    //Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (facebook) profileFields.social.facebook = facebook;
    try {
      let profile = await Profile.findOne({ user: req.user.id });

      //If profile exists
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      //If profile doesn't exist, Create
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  Get api/profile
//@desc   Get all profiles
//@access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    if (err.name == 'CastError') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile
// @desc     DELETE profile, user & posts
// @access   Private
router.delete('/', auth, async (req, res) => {
  try {
    //@todo - remove users posts
    await Post.deleteMany({user:req.user.id})
    //Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User and Profile deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/profile/experience
// @desc     PUT profile experiences
// @access   Private
router.put(
  '/experience',
  auth,
  [
    check('title', 'Title is required')
    .not()
    .isEmpty(), 
    check('company', 'Company is required')
    .not()
    .isEmpty(), 
    check('from', 'From is required')
    .not()
    .isEmpty() 
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } 


    try {
      const profile = await Profile.findOne({user: req.user.id});
      //Unshift is the same as push but it puts at the beginning  
      //that way the most recents are at first ones
      profile.experience.unshift(newExp); 
      await profile.save();
      res.json(profile);      
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);


// @route    DELETE api/profile/experience/:exp_id
// @desc     DELETE experience from profile
// @access   Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile =await Profile.findOne({user: req.user.id});
    //Get remove index
    const removeIndex = profile.experience.map(item =>item.id).indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile); 
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/profile/education
// @desc     PUT profile educations
// @access   Private
router.put(
  '/education',
  auth,
  [
    check('school', 'School is required')
    .not()
    .isEmpty(), 
    check('degree', 'Degree is required')
    .not()
    .isEmpty(), 
    check('fieldofstudy', 'Fieldofstudy is required')
    .not()
    .isEmpty(), 
    check('from', 'From is required')
    .not()
    .isEmpty() 
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } 


    try {
      const profile = await Profile.findOne({user: req.user.id});
      //Unshift is the same as push but it puts at the beginning  
      //that way the most recents are at first ones
      profile.education.unshift(newEdu); 
      await profile.save();
      res.json(profile);      
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);


// @route    DELETE api/profile/education/:edu_id
// @desc     DELETE education from profile
// @access   Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile =await Profile.findOne({user: req.user.id});
    //Get remove index
    const removeIndex = profile.education
    .map(item =>item.id)
    .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile); 
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route    GET api/profile/github/:username
// @desc     GET user repos from 
// @access   Public

router.get('/github/:username',(req,res)=>{
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
      method: 'Get',
      headers: {'user-agent':'node.js'}
    };
    request(options,(error,response,body)=>{
      if(error){
        console.error(error);
      }
      if(response.statusCode!== 200){
         return res.status(404).json({msg:'No Github profile found'});
      }
      res.json(JSON.parse(body));
    })
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})
module.exports = router;
