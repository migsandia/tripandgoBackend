const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Trip = require('../models/Trip');

router.post('/', async (req, res, next) => {
  const { title, description, itinerary, date, dateInit, ageRange, numberPersons, imageURL  } = req.body;

  if (!title || !description || !itinerary || !date || !dateInit || !ageRange || !numberPersons) {
    return res.status(400).json({
      error: 'Debes rellenar todos los campos'
    });
  }
  if(dateInit>=date){
    return res.status(400).json({
      error: 'La fecha de inicio tiene que ser anterior a la fecha de fin'
    });
  }
  try {
    const newTrip = {
      owner: req.session.currentUser._id,
      title,
      description,
      itinerary,
      date,
      dateInit,
      ageRange,
      numberPersons,
      imageURL,
      participants: [req.session.currentUser._id]
    }
    const newTripCreated = await new Trip(newTrip);

    res.status(200)
    res.json(newTripCreated)
    newTripCreated.save();
  } catch (error) {
    next(error)
  }
}
);

// Devuelve al FrontEnd todos los viajes
router.get('/', async (req, res, next) => {
  const allTrips = await Trip.find()
  try {
    if (!allTrips) {
      res.status(404);
      res.json({ mesage: 'No hay viajes disponibles' })
      return;
    }
    res.json(allTrips);
  } catch (error) {
    next(error);
  }
});

//Viajes creados por el usuario
router.get('/mytrips', async (req, res, next) => {
  const ownerTrips = await Trip.find({ owner: req.session.currentUser._id })
  try {
    if (!ownerTrips) {
      res.status(404);
      res.json({ mesage: 'No hay viajes disponibles' })
      return;
    }
    res.json(ownerTrips);
  } catch (error) {
    next(error);
  }
});

// VIajes que el usuario se ha unido
router.get('/mytripsjoin', async (req, res, next) => {

  try {
    const joinTrips = await Trip.find({ participants: { $all: [req.session.currentUser._id] } })
    console.log(joinTrips)
    if (!joinTrips) {
      res.status(404);
      res.json({ mesage: 'No hay viajes disponibles' })
      return;
    }
    res.json(joinTrips);
  } catch (error) {
    next(error);
  }
});

//Devuelve al FrontEnd un viaje
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  const oneTrip = await Trip.findById(id).populate("participants");
  try {
    if (!oneTrip) {
      res.status(404);
      res.json({ mesage: 'La información del viaje no está disponible' })
      return;
    }
    res.json(oneTrip);
  } catch (error) {
    next(error);
  }
});


router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  const deleteTrip = await Trip.findById(id)
  if (deleteTrip.owner == req.session.currentUser._id) {
    const oneTrip = await Trip.findByIdAndDelete(id)
  } else {
    return;
  }
  try {
    res.status(200);
    res.json({ message: 'Viaje eliminado' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/edit', async (req, res, next) => {
  const { id } = req.params;
  const { title, description, itinerary, imageURL } = req.body;
  if (!title || !description || !itinerary ) {
    return res.status(400).json({
      error: 'Debes rellenar todos los campos'
    });
  }
  const updateTrip = {
    title,
    description,
    itinerary,
    imageURL
  }

  // Update Trip Created
  try {
    await Trip.findByIdAndUpdate(id, updateTrip, { new: true });
    res.status(200)
    res.json({ message: 'Viaje editado' })
  } catch (error) {
    next(error)
  }
});

// Unirse al viage
router.put('/:id/join', async (req, res, next) => {
  const { id } = req.params;
  let idUser = mongoose.Types.ObjectId(req.session.currentUser._id);

  // Update Trip Created
  try {
    await Trip.findByIdAndUpdate(id, { $push: { participants: idUser } }, { new: true });
    res.status(200)
    res.json({ message: 'Usuario unido' })
  } catch (error) {
    next(error)
  }

});

router.put('/:id/leave', async (req, res, next) => {
  const { id } = req.params;
  let idUser = mongoose.Types.ObjectId(req.session.currentUser._id);

  try {
    await Trip.findByIdAndUpdate(id, { $pull: { participants: idUser } }, { new: true });
    res.status(200)
    res.json({ message: 'Usuario eliminado' })
  } catch (error) {
    next(error)
  }
});



module.exports = router;