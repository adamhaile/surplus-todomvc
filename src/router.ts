import S from 's-js';
import { ToDosCtrl } from './controllers';

// with such a simple router scenario, no need for a lib, just hand-write it
export function ToDosRouter(ctrl : ToDosCtrl) {
    // filter() -> browser hash
    S(() => {
        var filter = ctrl.filter(),
            hash   = filter === true  ? "/completed" :
                     filter === false ? "/active"    :
                     "/";

        if (window.location.hash !== hash) window.location.hash = hash;
    });

    // browser hash -> filter()
    window.addEventListener('hashchange', setStateFromHash, false);
    S.cleanup(function () { window.removeEventListener('hashchange', setStateFromHash); });
    function setStateFromHash() {
        var hash   = window.location.hash,
            filter = hash === "#/completed" ? true  :
                     hash === "#/active"    ? false :
                     null;

        if (ctrl.filter() !== filter) ctrl.filter(filter);
    }

    // init from browser hash
    S.sample(setStateFromHash);
}
