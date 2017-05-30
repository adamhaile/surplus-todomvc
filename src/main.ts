import S from 's-js';

import { ToDosModel} from './models';
import { ToDosCtrl } from './controllers';
import { ToDosRouter } from './router';
import { LocalStoragePersistence } from './persistence';
import { AppView } from './views';

S.root(() => {
    const model = ToDosModel([]),
        ctrl = ToDosCtrl(model),
        router = ToDosRouter(ctrl),
        storage = LocalStoragePersistence(model),
        view = AppView(ctrl);

    document.body.appendChild(view);
});