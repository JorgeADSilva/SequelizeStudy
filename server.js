const express = require('express');
const Sequelize = require('sequelize');
const _USERS = require('./users.json');
const Op = Sequelize.Op;
const app = express();
const port = 8001;

const connection = new Sequelize('db', 'user', 'pass', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: 'db.sqlite',
    operatorsAliases: false,
    // define: {
    //     freezeTableName: true //to not pluralize the table name
    // }
});

const User = connection.define('User',
    {
        name: Sequelize.STRING,
        email: {
            type: Sequelize.STRING,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: Sequelize.STRING,
            validate: {
                isAlphanumeric: true
            }
        },
    }

//Users Table first approach
/*{
    uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    first: Sequelize.STRING,
    last: Sequelize.STRING,
    full_name: Sequelize.STRING,
    bio: {
        type: Sequelize.TEXT,
        validate: {
            contains: {
                args: ["Bio"],
                msg: "Error: Field must contain Bio"
            }
        }
    },
}, {
    timestamps: false, //to not create the createdAt and updatedAt fiels
    hooks: {
        beforeValidate: () => { console.log('Before validate'); },
        afterValidate: () => { console.log('After validate'); },
        beforeCreate: (user) => {
            user.full_name = `${user.first} ${user.last}`
            console.log('Before create');
        },
        afterCreate: () => { console.log('After create'); },
    }
}*/);

const Post = connection.define('Post',
    {
        title: Sequelize.STRING,
        content: Sequelize.TEXT
    }
);

const Comment = connection.define('Comment',
    {
        the_comment: Sequelize.STRING
    }
);

const Project = connection.define('Project',
    {
        title: Sequelize.STRING
    }
);

Post.belongsTo(User, { as: 'UserRef', foreignKey: 'userId' }); //Puts foreignKey UserId in Post table, the second parameter we rename the foreign key inside Post table

Post.hasMany(Comment, { as: 'All_Comments' }); // foreignKey = PostId in Comment table

//if we used many-to-may association we would need to use the belongsToMany() method in both classes (ex. User.belongsToMany(Post) and Post.belongsToMany(User))
//Creates a UserProjects table that joins both classes ids
User.belongsToMany(Project, { as: 'Tasks', through: 'UserProjects' });
Project.belongsToMany(User, { as: 'Workers', through: 'UserProjects' });

app.post('/post', (req, res) => {
    const newUser = req.body.user;
    User.create(newUser); //or we could pass each parameter like bellow
});

app.get('/', (req, res) => {
    User.create({
        first: 'Jorge',
        last: 'Silva',
        bio: 'Bio entry'
    }).then(user => {
        res.json(user)
    }).catch(error => {
        console.log(error);
        res.status(404).send(error);
    });
});

app.get('/findAll', (req, res) => {
    User.findAll().then(user => {
        res.json(user)
    }).catch(error => {
        console.log(error);
        res.status(404).send(error);
    });
});

app.get('/findAllMar', (req, res) => {
    User.findAll({
        where: {
            name: {
                [Op.like]: 'Mart%'
            }
        }
    }).then(user => {
        res.json(user)
    }).catch(error => {
        console.log(error);
        res.status(404).send(error);
    });
});

app.get('/findOne', (req, res) => {
    //With Sequelize v5, findById() was replaced by findByPk().
    User.findByPk('55')
        .then(user => {
            res.json(user)
        }).catch(error => {
            console.log(error);
            res.status(404).send(error);
        });
});


app.put('/update', (req, res) => {
    //With Sequelize v5, findById() was replaced by findByPk().
    User.update({ name: 'Jorge Silva', password: 'password' }, { where: { id: 1 } })
        .then(rows => {
            res.json(rows)
        }).catch(error => {
            console.log(error);
            res.status(404).send(error);
        });
});

app.delete('/remove', (req, res) => {
    //With Sequelize v5, findById() was replaced by findByPk().
    User.destroy({ where: { id: 100 } })
        .then(user => {
            res.send("User Successfully deleted")
        }).catch(error => {
            console.log(error);
            res.status(404).send(error);
        });
});

app.get('/singlePost', (req, res) => {
    Post.findByPk('1', {
        include: [{
            model: Comment, as: 'All_Comments',
            attributes: ['the_comment']
        }, {
            model: User, as: 'UserRef'
        }]
    }).then(post => {
        res.json(post)
    }).catch(error => {
        console.log(error);
        res.status(404).send(error);
    });
});

app.get('/findAllPosts', (req, res) => {
    Post.findAll({
        include: [{
            model: User, as: 'UserRef'
        }]
    }).then(post => {
        res.json(post)
    }).catch(error => {
        console.log(error);
        res.status(404).send(error);
    });
});

app.put('/addWorker', (req, res) => {
    Project.findByPk(1).then((project) => {
        project.addWorkers(3);
    }).then(() => {
        res.send('User added')
    }).catch(error => {
        console.log(error);
        res.status(404).send(error);
    });
});

app.get('/getUserProjects', (req, res) => {
    User.findAll({
        attributes: ['name'],
        include: [{
            model: Project, as: 'Tasks',
            attributes: ['title']
        }]
    }).then((output) => {
        res.json(output)
    }).catch(error => {
        console.log(error);
        res.status(404).send(error);
    });
});

connection
    .sync({
        logging: console.log,
        //force: true
    }).then(() => {
        // User.create({
        //     name: 'Jorge',
        //     bio: 'Bio entry'
        // })
        // User.bulkCreate(_USERS)
        //     .then(() => {
        //         console.log("Bulk successfully runned")
        //     }).catch(error => {
        //         console.log(error);
        //     });
    })
    // .then(() => {
    //     Project.create({
    //         title: 'Project 1'
    //     }).then((project) => {
    //         project.setWorkers([1, 2]);
    //     })
    // })
    // .then(() => {
    //     Post.create({
    //         userId: 1,
    //         title: 'First Post',
    //         content: 'Post Content'
    //     })
    //     Post.create({
    //         userId: 1,
    //         title: 'Second Post',
    //         content: 'Second Post Content'
    //     })
    //     Post.create({
    //         userId: 2,
    //         title: 'Third Post',
    //         content: 'Third Post Content'
    //     })
    // })
    // .then(() => {
    //     Comment.create({
    //         PostId: 1,
    //         the_comment: 'Comment 1',
    //     })
    //     Comment.create({
    //         PostId: 1,
    //         the_comment: 'Comment 2',
    //     })
    // })
    .then(() => {
        console.log('Connection to database establised susccessfully.');
    }).catch(err => {
        console.error("Unable to connect to the database: ", err);
    });

app.listen(port, () => {
    console.log("Running server on port " + port);
});
