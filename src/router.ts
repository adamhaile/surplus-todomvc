import S from 's-js';
import { ToDosCtrl } from './controllers';

// with such a simple router scenario, no need for a lib, just hand-write it
export function ToDosRouter(ctrl : ToDosCtrl) {
    // browser hash -> filter()
    window.addEventListener('hashchange', setStateFromHash, false);
    S.cleanup(function () { window.removeEventListener('hashchange', setStateFromHash); });
    function setStateFromHash() {
        var hash   = window.location.hash,
            filter = hash === "#/completed" ? true  :
                     hash === "#/active"    ? false :
                     null;

        ctrl.filter(filter);
    }

    // init from browser hash
    setStateFromHash();

    // filter() -> browser hash
    S(() => {
        var filter = ctrl.filter(),
            hash   = filter === true  ? "/completed" :
                     filter === false ? "/active"    :
                     "/";

        window.location.hash = hash;
    });
}
